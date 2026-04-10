-- ============================================================
-- STRESS TEST AUDIT REMEDIATION — PHASE 2
-- Addresses: ST-H-16, ST-H-17, ST-M-01
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- ST-H-16: API keys, webhook endpoints, webhook deliveries
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

DO $$ BEGIN
  DROP POLICY IF EXISTS "api_keys_org" ON api_keys;
  CREATE POLICY "api_keys_org" ON api_keys FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "webhook_endpoints_org" ON webhook_endpoints;
  CREATE POLICY "webhook_endpoints_org" ON webhook_endpoints FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_status INT,
  response_body TEXT,
  attempt INT NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);

-- ────────────────────────────────────────────────────────────
-- ST-H-17: time_entries column rename (safe — ADD IF NOT EXISTS)
-- We can't easily rename with IF NOT EXISTS so we use ADD + backfill
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  -- Only add if 'is_billable' doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'is_billable'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN is_billable BOOLEAN NOT NULL DEFAULT false;
    -- Attempt to copy from old column if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'billable'
    ) THEN
      UPDATE time_entries SET is_billable = billable;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE time_entries ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'time_entries' AND column_name = 'approved'
    ) THEN
      UPDATE time_entries SET is_approved = approved;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(proposal_id) WHERE is_billable = true;
CREATE INDEX IF NOT EXISTS idx_time_entries_approved ON time_entries(proposal_id) WHERE is_approved = true;

-- ────────────────────────────────────────────────────────────
-- ST-M-01: Consolidate warehouse_facilities → facilities
-- Add type discriminator to facilities table
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE facilities ADD COLUMN IF NOT EXISTS facility_type TEXT NOT NULL DEFAULT 'office';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Apply updated_at triggers to new tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['webhook_endpoints']) LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
