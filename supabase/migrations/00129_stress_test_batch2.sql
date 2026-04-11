-- Stress Test Audit Remediation: Batch 2
-- Covers gaps #19, #20, #23, #25 from the 9-module stress test audit

-- ═══════════════════════════════════════════════════════
-- #19: Add missing extended columns to portfolio_library
-- (venue, location, services_provided, results)
-- ═══════════════════════════════════════════════════════

ALTER TABLE portfolio_library ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE portfolio_library ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE portfolio_library ADD COLUMN IF NOT EXISTS services_provided TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE portfolio_library ADD COLUMN IF NOT EXISTS results TEXT;

-- ═══════════════════════════════════════════════════════
-- #20: Make image_url nullable to match application code
-- Schema originally had NOT NULL but all UI code treats it as nullable
-- ═══════════════════════════════════════════════════════

ALTER TABLE portfolio_library ALTER COLUMN image_url DROP NOT NULL;

-- ═══════════════════════════════════════════════════════
-- #23: Add deleted_at to project_portals for soft-delete support
-- portal/page.tsx queries .is('deleted_at', null) but column didn't exist
-- ═══════════════════════════════════════════════════════

ALTER TABLE project_portals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_project_portals_active
  ON project_portals(organization_id) WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════
-- #25: Add territories lookup table and territory_id FK on deals
-- Enables explicit territory assignment vs client-address inference
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  states TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territories_org ON territories(organization_id);

-- Apply updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at' AND tgrelid = 'territories'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON territories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END;
$$;

-- Add territory_id FK to deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deals_territory ON deals(territory_id);

-- RLS for territories
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_read_territories" ON territories;
CREATE POLICY "org_read_territories" ON territories
  FOR SELECT USING (organization_id = auth_user_org_id());

DROP POLICY IF EXISTS "admin_manage_territories" ON territories;
CREATE POLICY "admin_manage_territories" ON territories
  FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- ═══════════════════════════════════════════════════════
-- #8: Add commission_rate to org settings pipeline config
-- Stores configurable commission rate instead of hardcoded 10%
-- ═══════════════════════════════════════════════════════

-- No schema change needed — commission_rate will be stored in
-- organizations.settings JSONB under the key "commission_rate"
-- Default of 0.10 (10%) is applied in application code when missing.
