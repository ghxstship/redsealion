-- =============================================================================
-- Migration 00119: Session 2 Gap Audit Remediation (April 2026)
-- Closes all remaining schema-level gaps from docs/gap-audit-2026-04.md
-- Covers: GAP-C-09 (S2), GAP-C-10 (S2), GAP-C-11 (S2),
--         GAP-H-21 through GAP-H-29 (S2), GAP-M-15 through GAP-M-24 (S2),
--         GAP-L-12 through GAP-L-17 (S2)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-09 (S2): campaigns — open_token / click_token columns + RPC functions
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS open_token             UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS click_token            UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS click_destination_url  TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_open_token
  ON public.campaigns(open_token) WHERE open_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_click_token
  ON public.campaigns(click_token) WHERE click_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.increment_campaign_open(p_token UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.campaigns
  SET open_count = open_count + 1
  WHERE open_token = p_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_campaign_click(p_token UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.campaigns
  SET click_count = click_count + 1
  WHERE click_token = p_token;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-10 (S2): api_keys, webhook_endpoints, webhook_deliveries tables
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  key_prefix      TEXT        NOT NULL,
  key_hash        TEXT        NOT NULL,
  scopes          TEXT[]      NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "api_keys_insert" ON public.api_keys FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "api_keys_update" ON public.api_keys FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "api_keys_delete" ON public.api_keys FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_api_keys_org
  ON public.api_keys(organization_id) WHERE revoked_at IS NULL;


CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT,
  url             TEXT        NOT NULL,
  events          TEXT[]      NOT NULL DEFAULT '{}',
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  secret          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_select" ON public.webhook_endpoints FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "webhook_endpoints_insert" ON public.webhook_endpoints FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "webhook_endpoints_update" ON public.webhook_endpoints FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "webhook_endpoints_delete" ON public.webhook_endpoints FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org
  ON public.webhook_endpoints(organization_id) WHERE is_active = true;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_webhook_endpoints
    BEFORE UPDATE ON public.webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     UUID        NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event           TEXT        NOT NULL,
  payload         JSONB,
  status_code     INTEGER,
  response_time_ms INTEGER,
  error_message   TEXT,
  delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "webhook_deliveries_insert" ON public.webhook_deliveries FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint
  ON public.webhook_deliveries(endpoint_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org
  ON public.webhook_deliveries(organization_id, delivered_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-C-11 (S2): time_entries — is_billable / is_approved generated columns
-- Adds alias columns to bridge the naming gap without breaking existing code.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Only add generated column if source column exists and alias does not
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'billable'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'is_billable'
  ) THEN
    ALTER TABLE public.time_entries
      ADD COLUMN is_billable BOOLEAN GENERATED ALWAYS AS (billable) STORED;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'approved'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE public.time_entries
      ADD COLUMN is_approved BOOLEAN GENERATED ALWAYS AS (approved) STORED;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-21 (S2): organizations — unique slug constraint
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations(slug) WHERE slug IS NOT NULL AND slug <> '';


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-26 (S2): assets — asset_class discriminator column
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS asset_class TEXT NOT NULL DEFAULT 'equipment'
  CHECK (asset_class IN ('equipment', 'inventory', 'prop', 'vehicle'));

CREATE INDEX IF NOT EXISTS idx_assets_class
  ON public.assets(organization_id, asset_class);


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-28 (S2): automation_runs → automations stats sync trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_automation_run_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.automations
  SET
    run_count   = COALESCE(run_count, 0) + 1,
    last_run_at = NEW.ran_at
  WHERE id = NEW.automation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_automation_run_stats ON public.automation_runs;
CREATE TRIGGER trg_automation_run_stats
  AFTER INSERT ON public.automation_runs
  FOR EACH ROW EXECUTE FUNCTION public.sync_automation_run_stats();


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-29 (S2): time_off_requests table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_off_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'bereavement', 'unpaid')),
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reason          TEXT,
  approved_by     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_off_requests_select" ON public.time_off_requests FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "time_off_requests_insert" ON public.time_off_requests FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id() AND user_id = auth.uid());
CREATE POLICY "time_off_requests_update" ON public.time_off_requests FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "time_off_requests_delete" ON public.time_off_requests FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_time_off_requests_user
  ON public.time_off_requests(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_org_status
  ON public.time_off_requests(organization_id, status);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_time_off_requests
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-19 (S2): work_orders — wo_number sequence default
-- Only adds the sequence and default if wo_number has no default yet.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.work_order_number_seq;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'work_orders'
      AND column_name  = 'wo_number'
      AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.work_orders
      ALTER COLUMN wo_number
      SET DEFAULT 'WO-' || LPAD(nextval('public.work_order_number_seq')::TEXT, 4, '0');
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-20 (S2): goals — category CHECK constraint
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'goals' AND constraint_name = 'goals_category_check'
  ) THEN
    ALTER TABLE public.goals
      ADD CONSTRAINT goals_category_check
      CHECK (category IN ('Company', 'Team', 'Personal', 'Financial', 'Product', 'Customer'));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-M-21 (S2): projects — client_id FK
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_client
  ON public.projects(client_id) WHERE client_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-H-25 (S2): revenue_recognition — confirm organization_id index
-- Table was created in 00116; ensure org index exists.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rev_rec_org
  ON public.revenue_recognition(organization_id, recognition_date DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-17 (S2): ai_conversations — last_message_at for session display
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.sync_ai_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_conversations
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_conversation_last_message ON public.ai_messages;
CREATE TRIGGER trg_ai_conversation_last_message
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_ai_conversation_last_message();


-- ─────────────────────────────────────────────────────────────────────────────
-- GAP-L-13 (S2): custom_reports table for Reports Builder
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  query_config    JSONB       NOT NULL DEFAULT '{}',
  chart_type      TEXT        NOT NULL DEFAULT 'table'
                  CHECK (chart_type IN ('table', 'bar', 'line', 'pie', 'area')),
  is_pinned       BOOLEAN     NOT NULL DEFAULT false,
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_reports_select" ON public.custom_reports FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "custom_reports_insert" ON public.custom_reports FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "custom_reports_update" ON public.custom_reports FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "custom_reports_delete" ON public.custom_reports FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_custom_reports_org
  ON public.custom_reports(organization_id, updated_at DESC);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_custom_reports
    BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
