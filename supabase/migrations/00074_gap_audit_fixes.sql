-- =============================================================================
-- Migration 00074: Gap Audit Remediation (Critical + High)
-- =============================================================================
-- Addresses findings from the operational & functional gap audit.
-- Changes:
--   1. Consolidate audit_log → audit_logs (C-01)
--   2. Add soft-delete infrastructure to core tables (C-02)
--   3. Add DELETE policy for proposal_comments (H-18)
--   4. Add created_by to core tables (H-19)
--   5. Add RLS to campaign_recipients (H-16)
--   6. Add probability CHECK constraint (L-05)
--   7. Add client status column (L-10)
--   8. Add invoice_line_items sort_order (L-09)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. AUDIT LOG CONSOLIDATION (C-01)
-- ═══════════════════════════════════════════════════════════════════════
-- The canonical audit table is `audit_logs` (00062). Legacy code writes
-- to `audit_log` (00001 activity_log predecessor). We redirect writes to
-- `audit_logs` by creating a compatibility view + trigger.

-- Mark legacy table: rename to make the break obvious
ALTER TABLE IF EXISTS public.audit_log RENAME TO _audit_log_legacy;

-- Create a redirect view using the `audit_logs` schema so old code
-- inserting into "audit_log" will be intercepted below
CREATE OR REPLACE VIEW public.audit_log AS
  SELECT
    id,
    organization_id,
    actor_id AS user_id,
    action,
    entity AS entity_type,
    entity_id,
    metadata,
    ip_address,
    created_at
  FROM public.audit_logs;

-- Instead-of INSERT trigger so fire-and-forget callers using .from('audit_log') still work
CREATE OR REPLACE FUNCTION public._audit_log_redirect_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    organization_id, actor_id, action, entity, entity_id, metadata, ip_address, created_at
  ) VALUES (
    NEW.organization_id,
    COALESCE(NEW.user_id, auth.uid()),
    NEW.action,
    NEW.entity_type,
    NEW.entity_id,
    COALESCE(NEW.metadata, '{}'::jsonb),
    NEW.ip_address,
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_log_insert_redirect
  INSTEAD OF INSERT ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public._audit_log_redirect_insert();


-- ═══════════════════════════════════════════════════════════════════════
-- 2. SOFT DELETE INFRASTRUCTURE (C-02)
-- ═══════════════════════════════════════════════════════════════════════
-- Add deleted_at TIMESTAMPTZ to core entities.
-- NOTE: RLS policies are NOT updated to filter deleted_at IS NULL here
-- — that would require rewriting every policy. Instead, application-layer
-- queries should add .is('deleted_at', null) until RLS is standardized.

ALTER TABLE public.organizations    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.clients          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.proposals        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.invoices         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.assets           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.tasks            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.users            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.projects         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.events           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes for efficient non-deleted queries
CREATE INDEX IF NOT EXISTS idx_organizations_active  ON public.organizations(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_active        ON public.clients(id)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_active       ON public.proposals(id)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_active        ON public.invoices(id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_active          ON public.assets(id)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_active           ON public.tasks(id)         WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_active        ON public.projects(id)      WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. PROPOSAL COMMENTS DELETE POLICY (H-18)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "comments_delete" ON proposal_comments FOR DELETE
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_comments.proposal_id
      AND p.organization_id = auth_user_org_id()
    )
    AND (author_id = auth.uid() OR is_org_admin_or_above())
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 4. CREATED_BY ON CORE TABLES (H-19)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.invoices      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.clients       ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.expenses      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.assets        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.time_entries  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS FOR CAMPAIGN_RECIPIENTS (H-16)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "campaign_recipients_select" ON campaign_recipients
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "campaign_recipients_insert" ON campaign_recipients
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "campaign_recipients_update" ON campaign_recipients
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "campaign_recipients_delete" ON campaign_recipients
  FOR DELETE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id IN (SELECT user_org_ids())
    )
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 6. PROBABILITY CHECK (L-05)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_probability_range
  CHECK (probability_percent IS NULL OR (probability_percent >= 0 AND probability_percent <= 100));


-- ═══════════════════════════════════════════════════════════════════════
-- 7. CLIENT STATUS (L-10)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive', 'churned'));

CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(organization_id, status);


-- ═══════════════════════════════════════════════════════════════════════
-- 8. INVOICE LINE ITEM SORT ORDER (L-09)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.invoice_line_items
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
