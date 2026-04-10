-- =============================================================================
-- Migration 00080: Operations Gap Remediation — Phase 2
-- =============================================================================
-- Addresses remaining High/Medium/Low schema gaps from Operations audit.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1. EVENT CONTACTS TABLE (GAP-OPS-013)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS event_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_role TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_contacts_event ON event_contacts(event_id);

ALTER TABLE event_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_access_event_contacts" ON event_contacts;
CREATE POLICY "org_access_event_contacts" ON event_contacts
  FOR ALL USING (
    event_id IN (SELECT id FROM events WHERE organization_id IN (SELECT user_org_ids()))
  );

DROP TRIGGER IF EXISTS set_updated_at_event_contacts ON event_contacts;
CREATE TRIGGER set_updated_at_event_contacts
  BEFORE UPDATE ON event_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 2. LOCATIONS ADDRESS COLUMNS (GAP-OPS-014)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';


-- ═══════════════════════════════════════════════════════════════════════
-- 3. JUNCTION TABLE updated_at (GAP-OPS-015)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE event_locations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_event_locations ON event_locations;
CREATE TRIGGER set_updated_at_event_locations
  BEFORE UPDATE ON event_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE project_events
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_project_events ON project_events;
CREATE TRIGGER set_updated_at_project_events
  BEFORE UPDATE ON project_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE project_locations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_project_locations ON project_locations;
CREATE TRIGGER set_updated_at_project_locations
  BEFORE UPDATE ON project_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 4. WAREHOUSE FACILITIES TABLE (GAP-OPS-020)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS warehouse_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  facility_type TEXT NOT NULL DEFAULT 'warehouse'
    CHECK (facility_type IN ('warehouse', 'staging', 'shop', 'office', 'client_site', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_facilities_org ON warehouse_facilities(organization_id);

ALTER TABLE warehouse_facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_access_warehouse_facilities" ON warehouse_facilities;
CREATE POLICY "org_access_warehouse_facilities" ON warehouse_facilities
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DROP TRIGGER IF EXISTS set_updated_at_warehouse_facilities ON warehouse_facilities;
CREATE TRIGGER set_updated_at_warehouse_facilities
  BEFORE UPDATE ON warehouse_facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 5. SHIPMENTS PACKING_LIST_ID (GAP-OPS-025)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS packing_list_id UUID;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. EQUIPMENT BUNDLE ITEMS TABLE (GAP-OPS-028)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS equipment_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES equipment_bundles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON equipment_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_asset ON equipment_bundle_items(asset_id);

ALTER TABLE equipment_bundle_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_access_bundle_items" ON equipment_bundle_items;
CREATE POLICY "org_access_bundle_items" ON equipment_bundle_items
  FOR ALL USING (
    bundle_id IN (SELECT id FROM equipment_bundles WHERE organization_id IN (SELECT user_org_ids()))
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 7. SCHEDULE BLOCK ASSIGNMENTS TABLE (GAP-OPS-037)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS schedule_block_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES schedule_blocks(id) ON DELETE CASCADE,
  crew_profile_id UUID NOT NULL REFERENCES crew_profiles(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(block_id, crew_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_block_assignments_block ON schedule_block_assignments(block_id);
CREATE INDEX IF NOT EXISTS idx_block_assignments_crew ON schedule_block_assignments(crew_profile_id);

ALTER TABLE schedule_block_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_access_block_assignments" ON schedule_block_assignments;
CREATE POLICY "org_access_block_assignments" ON schedule_block_assignments
  FOR ALL USING (
    block_id IN (
      SELECT sb.id FROM schedule_blocks sb
      JOIN production_schedules ps ON sb.schedule_id = ps.id
      WHERE ps.organization_id IN (SELECT user_org_ids())
    )
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 8. SCHEDULE BLOCKS LOCATION FK (GAP-OPS-038)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE schedule_blocks
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_location ON schedule_blocks(location_id)
  WHERE location_id IS NOT NULL;
