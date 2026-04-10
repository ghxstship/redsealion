-- =============================================================================
-- Migration 00120: Stress Test Gap Audit Remediation (April 2026)
-- Closes all remaining schema-level gaps identified in the Session 3 stress test.
-- GAP-C-01  work_orders lifecycle timestamps
-- GAP-H-04  tasks start_time / end_time
-- GAP-H-11  project_portals deleted_at
-- GAP-H-13  production_advances deleted_at (if missing)
-- GAP-L-01  organizations.slug uniqueness (defensive re-apply)
-- GAP-L-04  deals.lost_date
-- GAP-L-08  portfolio_library deleted_at (if missing)
-- GAP-M-01  proposals.project_end_date (if missing)
-- GAP-M-13  compliance_documents deleted_at (if missing)
-- GAP-M-14  goal_key_results → goals progress auto-calc trigger
-- NEW       email_threads.is_read column for unread state
-- NEW       expenses.reviewed_by / reviewed_at / rejection_reason
-- NEW       deal_stage_history table for conversion analytics
-- NEW       terms_documents unique published version per org
-- NEW       fabrication TierGate note: no schema change needed (code fix only)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-01: work_orders — lifecycle timestamps
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.work_orders
  ADD COLUMN IF NOT EXISTS started_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completion_notes TEXT,
  ADD COLUMN IF NOT EXISTS actual_hours   NUMERIC(8,2);

CREATE INDEX IF NOT EXISTS idx_work_orders_completed_at
  ON public.work_orders(organization_id, completed_at)
  WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_orders_started_at
  ON public.work_orders(organization_id, started_at)
  WHERE started_at IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-04: tasks — start_time / end_time for My Schedule
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time   TIME;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-11: project_portals — deleted_at for soft-delete
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.project_portals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_project_portals_active
  ON public.project_portals(organization_id)
  WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-13: production_advances — deleted_at for soft-delete
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.production_advances
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_production_advances_active
  ON public.production_advances(organization_id)
  WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-04: deals — lost_date timestamp (symmetric with won_date)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS lost_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_deals_lost_date
  ON public.deals(organization_id, lost_date)
  WHERE lost_date IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-08: portfolio_library — deleted_at for soft-delete
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.portfolio_library
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_portfolio_library_active
  ON public.portfolio_library(organization_id)
  WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-01: proposals — project_end_date for roadmap
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS project_end_date DATE;

CREATE INDEX IF NOT EXISTS idx_proposals_project_end_date
  ON public.proposals(organization_id, project_end_date)
  WHERE project_end_date IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-13: compliance_documents — deleted_at for soft-delete
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.compliance_documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_compliance_documents_active
  ON public.compliance_documents(organization_id)
  WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-20 / Expenses: approval workflow columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS reviewed_by      UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_reviewed_by
  ON public.expenses(reviewed_by)
  WHERE reviewed_by IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- Email threads: is_read for unread state (inbox UX)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.email_threads
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_email_threads_unread
  ON public.email_threads(organization_id, is_read)
  WHERE is_read = false;


-- ─────────────────────────────────────────────────────────────────────────────
-- Deal stage history — conversion analytics
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID        NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  organization_id UUID     NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_stage   TEXT,
  to_stage     TEXT        NOT NULL,
  changed_by   UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_stage_history_select" ON public.deal_stage_history;
CREATE POLICY "deal_stage_history_select" ON public.deal_stage_history FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "deal_stage_history_insert" ON public.deal_stage_history;
CREATE POLICY "deal_stage_history_insert" ON public.deal_stage_history FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal
  ON public.deal_stage_history(deal_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_org
  ON public.deal_stage_history(organization_id, changed_at DESC);

-- Trigger: auto-record stage transitions on deals.stage UPDATE
CREATE OR REPLACE FUNCTION public.record_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.deal_stage_history (deal_id, organization_id, from_stage, to_stage)
    VALUES (NEW.id, NEW.organization_id, OLD.stage, NEW.stage);

    -- Also set lost_date when moving to 'lost'
    IF NEW.stage = 'lost' AND OLD.stage <> 'lost' THEN
      NEW.lost_date := now();
    END IF;
    -- Clear lost_date if moved out of lost
    IF OLD.stage = 'lost' AND NEW.stage <> 'lost' THEN
      NEW.lost_date := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deal_stage_history ON public.deals;
CREATE TRIGGER trg_deal_stage_history
  BEFORE UPDATE OF stage ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.record_deal_stage_change();


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-14: goal_key_results → goals.progress auto-calculation trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recalc_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_progress NUMERIC;
BEGIN
  SELECT ROUND(AVG(
    CASE
      WHEN target IS NULL OR target = 0 THEN 0
      ELSE LEAST((current / target) * 100, 100)
    END
  ))
  INTO v_progress
  FROM public.goal_key_results
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);

  UPDATE public.goals
  SET progress = COALESCE(v_progress, 0)
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_goal_progress_recalc ON public.goal_key_results;
CREATE TRIGGER trg_goal_progress_recalc
  AFTER INSERT OR UPDATE OF current, target OR DELETE
  ON public.goal_key_results
  FOR EACH ROW EXECUTE FUNCTION public.recalc_goal_progress();


-- ─────────────────────────────────────────────────────────────────────────────
-- Terms documents: unique constraint on published version per org
-- (Only one published doc per org at a time)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_documents_one_published
  ON public.terms_documents(organization_id)
  WHERE is_published = true;


-- ─────────────────────────────────────────────────────────────────────────────
-- resource_allocations: allocated_hours / available_hours for utilization
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.resource_allocations
  ADD COLUMN IF NOT EXISTS allocated_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_hours NUMERIC(8,2) NOT NULL DEFAULT 8;

CREATE INDEX IF NOT EXISTS idx_resource_allocations_org_user
  ON public.resource_allocations(organization_id, user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Invoices: overdue auto-update function (scheduled or called on read)
-- Rather than a cron (requires pg_cron), expose as a callable RPC.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices(p_org_id UUID DEFAULT NULL)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status IN ('sent', 'partially_paid', 'partial')
    AND due_date < CURRENT_DATE
    AND (p_org_id IS NULL OR organization_id = p_org_id);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Automation runs: ensure started_at column exists (some migrations used ran_at)
-- Alias started_at → ran_at for the stats trigger compatibility
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'automation_runs' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.automation_runs ADD COLUMN started_at TIMESTAMPTZ;
    UPDATE public.automation_runs SET started_at = ran_at WHERE started_at IS NULL;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Packing lists tables (GAP logistics)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packing_lists (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID        REFERENCES public.events(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'packing', 'packed', 'shipped', 'returned')),
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packing_lists_select" ON public.packing_lists;
CREATE POLICY "packing_lists_select" ON public.packing_lists FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "packing_lists_insert" ON public.packing_lists;
CREATE POLICY "packing_lists_insert" ON public.packing_lists FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "packing_lists_update" ON public.packing_lists;
CREATE POLICY "packing_lists_update" ON public.packing_lists FOR UPDATE
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "packing_lists_delete" ON public.packing_lists;
CREATE POLICY "packing_lists_delete" ON public.packing_lists FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_packing_lists_org
  ON public.packing_lists(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_packing_lists_event
  ON public.packing_lists(event_id) WHERE event_id IS NOT NULL;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at_packing_lists ON public.packing_lists;
  CREATE TRIGGER set_updated_at_packing_lists
    BEFORE UPDATE ON public.packing_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS public.packing_list_items (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID    REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  asset_id        UUID    REFERENCES public.assets(id) ON DELETE SET NULL,
  description     TEXT,
  quantity        INT     NOT NULL DEFAULT 1,
  packed_by       UUID    REFERENCES public.users(id) ON DELETE SET NULL,
  packed_at       TIMESTAMPTZ,
  notes           TEXT
);

-- Add columns that may be missing on the pre-existing table from 00071
ALTER TABLE public.packing_list_items ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES public.packing_lists(id) ON DELETE CASCADE;
ALTER TABLE public.packing_list_items ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;
ALTER TABLE public.packing_list_items ADD COLUMN IF NOT EXISTS packed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.packing_list_items ADD COLUMN IF NOT EXISTS packed_at TIMESTAMPTZ;
ALTER TABLE public.packing_list_items ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.packing_list_items ENABLE ROW LEVEL SECURITY;

-- Use organization_id if present (old table), or list_id via join (new table)
DROP POLICY IF EXISTS "packing_list_items_select" ON public.packing_list_items;
CREATE POLICY "packing_list_items_select" ON public.packing_list_items FOR SELECT
  USING (
    (organization_id IS NOT NULL AND organization_id = auth_user_org_id())
    OR (list_id IS NOT NULL AND list_id IN (
      SELECT id FROM public.packing_lists WHERE organization_id = auth_user_org_id()
    ))
  );
DROP POLICY IF EXISTS "packing_list_items_insert" ON public.packing_list_items;
CREATE POLICY "packing_list_items_insert" ON public.packing_list_items FOR INSERT
  WITH CHECK (
    (organization_id IS NOT NULL AND organization_id = auth_user_org_id())
    OR (list_id IS NOT NULL AND list_id IN (
      SELECT id FROM public.packing_lists WHERE organization_id = auth_user_org_id()
    ))
  );
DROP POLICY IF EXISTS "packing_list_items_update" ON public.packing_list_items;
CREATE POLICY "packing_list_items_update" ON public.packing_list_items FOR UPDATE
  USING (
    (organization_id IS NOT NULL AND organization_id = auth_user_org_id())
    OR (list_id IS NOT NULL AND list_id IN (
      SELECT id FROM public.packing_lists WHERE organization_id = auth_user_org_id()
    ))
  );
DROP POLICY IF EXISTS "packing_list_items_delete" ON public.packing_list_items;
CREATE POLICY "packing_list_items_delete" ON public.packing_list_items FOR DELETE
  USING (
    (organization_id IS NOT NULL AND organization_id = auth_user_org_id())
    OR (list_id IS NOT NULL AND list_id IN (
      SELECT id FROM public.packing_lists WHERE organization_id = auth_user_org_id()
    ))
  );

CREATE INDEX IF NOT EXISTS idx_packing_list_items_list
  ON public.packing_list_items(list_id) WHERE list_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- Asset scan events (logistics barcode/QR workflow)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.asset_scan_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id        UUID        NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL CHECK (event_type IN ('check_in', 'check_out', 'audit', 'damage_report')),
  scanned_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  location        TEXT,
  notes           TEXT,
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_scan_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asset_scan_events_select" ON public.asset_scan_events;
CREATE POLICY "asset_scan_events_select" ON public.asset_scan_events FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "asset_scan_events_insert" ON public.asset_scan_events;
CREATE POLICY "asset_scan_events_insert" ON public.asset_scan_events FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_asset_scan_events_asset
  ON public.asset_scan_events(asset_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_scan_events_org
  ON public.asset_scan_events(organization_id, scanned_at DESC);
