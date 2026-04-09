-- =============================================================================
-- Migration 00079: Operations Module Gap Remediation
-- =============================================================================
-- Addresses Critical + High schema gaps identified in the Operations audit.
-- Covers Events, Logistics, Equipment, Schedule, Fabrication, Rentals,
-- Procurement, and Work Orders.
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SOFT-DELETE & AUDIT COLUMNS: events, locations, activations
-- GAP-OPS-001, GAP-OPS-002, GAP-OPS-011, GAP-OPS-054
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE activations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Partial indexes for soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_events_active ON events(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activations_active ON activations(organization_id) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. DAILY REPORTS TABLE (GAP-OPS-005)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  activation_id UUID REFERENCES activations(id) ON DELETE SET NULL,
  report_date DATE NOT NULL,
  -- Weather
  weather JSONB DEFAULT '{}'::jsonb,
  -- Labor
  labor_hours DECIMAL(8,2) DEFAULT 0,
  crew_count INT DEFAULT 0,
  -- Deliveries
  deliveries_received INT DEFAULT 0,
  deliveries_notes TEXT,
  -- Incidents
  incidents JSONB DEFAULT '[]'::jsonb,
  -- General
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  filed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, event_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_org ON daily_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_event ON daily_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_daily_reports" ON daily_reports
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_daily_reports" ON daily_reports
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_daily_reports" ON daily_reports
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_daily_reports" ON daily_reports
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

CREATE TRIGGER set_updated_at_daily_reports
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 3. ADD event_id FK TO tasks TABLE (GAP-OPS-006)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'standard'
    CHECK (task_type IN ('standard', 'punch_list', 'daily_report', 'checklist'));

CREATE INDEX IF NOT EXISTS idx_tasks_event ON tasks(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(organization_id, task_type);


-- ═══════════════════════════════════════════════════════════════════════
-- 4. MISSING updated_at TRIGGERS (GAP-OPS-018, 035, 049, 052)
-- ═══════════════════════════════════════════════════════════════════════

-- production_schedules
DROP TRIGGER IF EXISTS set_updated_at_production_schedules ON production_schedules;
CREATE TRIGGER set_updated_at_production_schedules
  BEFORE UPDATE ON production_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- fabrication_orders
DROP TRIGGER IF EXISTS set_updated_at_fabrication_orders ON fabrication_orders;
CREATE TRIGGER set_updated_at_fabrication_orders
  BEFORE UPDATE ON fabrication_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- purchase_requisitions
DROP TRIGGER IF EXISTS set_updated_at_purchase_requisitions ON purchase_requisitions;
CREATE TRIGGER set_updated_at_purchase_requisitions
  BEFORE UPDATE ON purchase_requisitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- rental_orders
DROP TRIGGER IF EXISTS set_updated_at_rental_orders ON rental_orders;
CREATE TRIGGER set_updated_at_rental_orders
  BEFORE UPDATE ON rental_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- shipments
DROP TRIGGER IF EXISTS set_updated_at_shipments ON shipments;
CREATE TRIGGER set_updated_at_shipments
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- asset_checkouts
DROP TRIGGER IF EXISTS set_updated_at_asset_checkouts ON asset_checkouts;
CREATE TRIGGER set_updated_at_asset_checkouts
  BEFORE UPDATE ON asset_checkouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- work_orders
DROP TRIGGER IF EXISTS set_updated_at_work_orders ON work_orders;
CREATE TRIGGER set_updated_at_work_orders
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- sub_rentals — add updated_at column first
ALTER TABLE sub_rentals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS set_updated_at_sub_rentals ON sub_rentals;
CREATE TRIGGER set_updated_at_sub_rentals
  BEFORE UPDATE ON sub_rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- bill_of_materials — add updated_at column
ALTER TABLE bill_of_materials
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_bom ON bill_of_materials;
CREATE TRIGGER set_updated_at_bom
  BEFORE UPDATE ON bill_of_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 5. FK CONSTRAINTS (GAP-OPS-023, 032)
-- ═══════════════════════════════════════════════════════════════════════

-- shipment_line_items.equipment_id → assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_shipment_lines_asset'
  ) THEN
    ALTER TABLE shipment_line_items
      ADD CONSTRAINT fk_shipment_lines_asset
      FOREIGN KEY (equipment_id) REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_shipment_lines_equipment ON shipment_line_items(equipment_id)
  WHERE equipment_id IS NOT NULL;

-- rental_line_items.equipment_id → assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_rental_lines_asset'
  ) THEN
    ALTER TABLE rental_line_items
      ADD CONSTRAINT fk_rental_lines_asset
      FOREIGN KEY (equipment_id) REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_rental_lines_equipment ON rental_line_items(equipment_id)
  WHERE equipment_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. FIX EQUIPMENT RLS (GAP-OPS-029)
-- Replace deprecated users.organization_id pattern with user_org_ids()
-- ═══════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "equipment_bundles_org_access" ON equipment_bundles;
CREATE POLICY "org_access_equipment_bundles" ON equipment_bundles
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "equipment_reservations_org_access" ON equipment_reservations;
CREATE POLICY "org_access_equipment_reservations" ON equipment_reservations
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "maintenance_records_org_access" ON maintenance_records;
CREATE POLICY "org_access_maintenance_records" ON maintenance_records
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ═══════════════════════════════════════════════════════════════════════
-- 7. EXPAND MAINTENANCE TYPE ENUM (GAP-OPS-031)
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER TYPE maintenance_type ADD VALUE IF NOT EXISTS 'preventive';
EXCEPTION WHEN others THEN
  NULL; -- already exists or not an enum
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 8. EQUIPMENT RESERVATIONS: nullable proposal_id + new contexts (GAP-OPS-027)
-- ═══════════════════════════════════════════════════════════════════════

-- Make proposal_id nullable (cannot be done directly, need to drop/recreate constraint)
ALTER TABLE equipment_reservations ALTER COLUMN proposal_id DROP NOT NULL;

ALTER TABLE equipment_reservations
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rental_order_id UUID REFERENCES rental_orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_reservations_event ON equipment_reservations(event_id)
  WHERE event_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 9. UNIQUENESS CONSTRAINTS (GAP-OPS-043, 047)
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_rental_orders_number'
  ) THEN
    ALTER TABLE rental_orders
      ADD CONSTRAINT uq_rental_orders_number UNIQUE (organization_id, order_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_requisitions_number'
  ) THEN
    ALTER TABLE purchase_requisitions
      ADD CONSTRAINT uq_requisitions_number UNIQUE (organization_id, requisition_number);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_fabrication_orders_number'
  ) THEN
    ALTER TABLE fabrication_orders
      ADD CONSTRAINT uq_fabrication_orders_number UNIQUE (organization_id, order_number);
  END IF;
END$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 10. WORK ORDERS: event_id/activation_id + soft-delete (GAP-OPS-048, 050)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activation_id UUID REFERENCES activations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_event ON work_orders(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_activation ON work_orders(activation_id) WHERE activation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_active ON work_orders(organization_id) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 11. FABRICATION INDEX (GAP-OPS-040)
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_fabrication_orders_type
  ON fabrication_orders(organization_id, order_type);
