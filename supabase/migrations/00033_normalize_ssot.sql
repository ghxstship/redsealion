-- =============================================================================
-- Migration 00033: Schema Normalization (3NF & SSOT Remediation)
-- =============================================================================
-- POLICY: NO BACKWARD COMPATIBILITY. All deprecated columns and tables are
-- dropped outright. App code MUST be updated before this migration runs.
-- =============================================================================


-- =============================================
-- TRANCHE 1: Critical SSOT Conflicts
-- =============================================

-- ---------------------------------------------------------------------------
-- V-01/V-02: RLS helpers now read ONLY from Harbor Master tables.
-- Legacy users.role and users.organization_id are DROPPED.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS UUID AS $$
  SELECT om.organization_id
  FROM public.organization_memberships om
  WHERE om.user_id = auth.uid() AND om.status = 'active'
  ORDER BY om.created_at ASC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS org_role AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  SELECT r.name INTO v_role_name
  FROM public.organization_memberships om
  JOIN public.roles r ON r.id = om.role_id
  WHERE om.user_id = auth.uid() AND om.status = 'active'
  ORDER BY r.hierarchy_level ASC
  LIMIT 1;

  RETURN CASE v_role_name
    WHEN 'platform_admin' THEN 'super_admin'::org_role
    WHEN 'org_owner' THEN 'org_admin'::org_role
    WHEN 'org_admin' THEN 'org_admin'::org_role
    WHEN 'project_manager' THEN 'project_manager'::org_role
    WHEN 'member' THEN 'designer'::org_role
    WHEN 'viewer' THEN 'client_viewer'::org_role
    WHEN 'external_collaborator' THEN 'client_viewer'::org_role
    ELSE 'designer'::org_role
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.hierarchy_level <= 2
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_producer_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.hierarchy_level <= 5
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.scope = 'platform'
      AND r.hierarchy_level <= 1
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_subscription_tier()
RETURNS subscription_tier AS $$
  SELECT o.subscription_tier
  FROM public.organizations o
  WHERE o.id = auth_user_org_id();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop legacy RLS policies that depend on deprecated columns before dropping the columns
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

-- Drop legacy auth columns from users
ALTER TABLE public.users DROP COLUMN IF EXISTS role;
ALTER TABLE public.users DROP COLUMN IF EXISTS organization_id;

-- Drop the legacy org_role enum type (will fail gracefully if still referenced by other columns)
-- We keep it only because auth_user_role() returns it for RLS policy compatibility.

-- ---------------------------------------------------------------------------
-- V-03 + V-11: Lead conversion FK gap + contact name decomposition
-- ---------------------------------------------------------------------------

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS converted_to_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_to_contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_last_name TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_converted_client
  ON public.leads(converted_to_client_id) WHERE converted_to_client_id IS NOT NULL;

-- Backfill split name from existing contact_name
UPDATE public.leads SET
  contact_first_name = CASE
    WHEN contact_name LIKE '% %'
    THEN left(contact_name, length(contact_name) - length(substring(contact_name FROM '[^ ]+$')) - 1)
    ELSE contact_name
  END,
  contact_last_name = CASE
    WHEN contact_name LIKE '% %'
    THEN substring(contact_name FROM '[^ ]+$')
    ELSE ''
  END
WHERE contact_first_name IS NULL AND contact_name IS NOT NULL;

-- Make the new columns canonical, drop the old one
ALTER TABLE public.leads
  ALTER COLUMN contact_first_name SET NOT NULL,
  ALTER COLUMN contact_last_name SET NOT NULL;
ALTER TABLE public.leads DROP COLUMN IF EXISTS contact_name;

-- ---------------------------------------------------------------------------
-- V-04: Drop proposals.deal_stage/expected_close_date/pipeline_id
-- (canonical stage lives on deals table)
-- ---------------------------------------------------------------------------

ALTER TABLE public.proposals DROP COLUMN IF EXISTS deal_stage;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS expected_close_date;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS pipeline_id;


-- =============================================
-- TRANCHE 2: Duplicate Table Definitions
-- =============================================

-- ---------------------------------------------------------------------------
-- V-05: Calendar sync configs — add missing columns, expand provider check
-- ---------------------------------------------------------------------------

ALTER TABLE public.calendar_sync_configs
  ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;

DO $$
BEGIN
  -- Drop old provider check constraint
  EXECUTE (
    SELECT format('ALTER TABLE public.calendar_sync_configs DROP CONSTRAINT %I', cc.constraint_name)
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name = ccu.constraint_name
      AND cc.constraint_schema = ccu.constraint_schema
    WHERE cc.constraint_schema = 'public'
      AND ccu.table_name = 'calendar_sync_configs'
      AND ccu.column_name = 'provider'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.calendar_sync_configs
  ADD CONSTRAINT calendar_sync_configs_provider_check
  CHECK (provider IN ('google', 'outlook', 'ical'));

-- ---------------------------------------------------------------------------
-- V-06: Drop saved_reports entirely, merge into custom_reports
-- ---------------------------------------------------------------------------

ALTER TABLE public.custom_reports
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Migrate any existing saved_reports data
INSERT INTO public.custom_reports (organization_id, name, query_config, created_by, is_favorite, created_at, updated_at)
SELECT organization_id, name, config, created_by, is_favorite, created_at, updated_at
FROM public.saved_reports
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS public.saved_reports CASCADE;

-- ---------------------------------------------------------------------------
-- V-07: Drop legacy permissions table (Harbor Master RBAC is canonical)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.permissions CASCADE;

-- ---------------------------------------------------------------------------
-- V-08: Drop users.notification_preferences JSONB blob
-- (canonical source: notification_preferences table from 00017)
-- ---------------------------------------------------------------------------

ALTER TABLE public.users DROP COLUMN IF EXISTS notification_preferences;


-- =============================================
-- TRANCHE 3: Structural JSONB Extraction
-- =============================================

-- ---------------------------------------------------------------------------
-- V-10: Extract organizations.settings into typed columns, drop the blob
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS proposal_prefix TEXT NOT NULL DEFAULT 'FD';

-- Backfill from JSONB blob
UPDATE public.organizations SET
  timezone = COALESCE(settings->>'timezone', 'America/New_York'),
  currency = COALESCE(settings->>'currency', 'USD'),
  invoice_prefix = COALESCE(settings->>'invoicePrefix', 'INV'),
  proposal_prefix = COALESCE(settings->>'proposalPrefix', 'FD')
WHERE settings IS NOT NULL AND settings != '{}'::jsonb;

ALTER TABLE public.organizations DROP COLUMN IF EXISTS settings;


-- =============================================
-- TRANCHE 4: Missing FKs & Junction Tables
-- =============================================

-- ---------------------------------------------------------------------------
-- V-12: Add signer_contact_id FK to esignature_requests
-- ---------------------------------------------------------------------------

ALTER TABLE public.esignature_requests
  ADD COLUMN IF NOT EXISTS signer_contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- V-14: Create warehouse_transfer_items junction table, drop JSONB blob
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.warehouse_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.warehouse_transfers(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON public.warehouse_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_asset ON public.warehouse_transfer_items(asset_id);

ALTER TABLE public.warehouse_transfer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfer_items_org_access" ON public.warehouse_transfer_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.warehouse_transfers wt
      WHERE wt.id = transfer_id
      AND wt.organization_id = auth_user_org_id()
    )
  );

ALTER TABLE public.warehouse_transfers DROP COLUMN IF EXISTS items;
