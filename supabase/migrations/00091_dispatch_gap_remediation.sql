-- =============================================================================
-- Migration 00091: Dispatch Module Gap Remediation
-- =============================================================================
-- Addresses Critical + High schema gaps identified in the Dispatch audit.
-- Covers: DISP-014, DISP-024, DISP-026, DISP-011
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. UNIQUE CONSTRAINT ON wo_number (DISP-014)
-- Prevents duplicate work order numbers under concurrent creation.
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_work_orders_wo_number'
  ) THEN
    ALTER TABLE work_orders
      ADD CONSTRAINT uq_work_orders_wo_number UNIQUE (organization_id, wo_number);
  END IF;
END$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 2. work_order_assignments: add updated_at + trigger (DISP-024)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE work_order_assignments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_wo_assignments ON work_order_assignments;
CREATE TRIGGER set_updated_at_wo_assignments
  BEFORE UPDATE ON work_order_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 3. WORK ORDER STATUS LOG TABLE (DISP-026)
-- Tracks every status transition for an audit trail.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS work_order_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wo_status_log_wo ON work_order_status_log(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_status_log_created ON work_order_status_log(created_at);

ALTER TABLE work_order_status_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_read_wo_status_log" ON work_order_status_log;
CREATE POLICY "org_read_wo_status_log" ON work_order_status_log
  FOR SELECT USING (
    work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
DROP POLICY IF EXISTS "org_insert_wo_status_log" ON work_order_status_log;
CREATE POLICY "org_insert_wo_status_log" ON work_order_status_log
  FOR INSERT WITH CHECK (
    work_order_id IN (SELECT id FROM work_orders WHERE organization_id IN (SELECT user_org_ids()))
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 4. WORK ORDER ASSIGNMENTS: API endpoint support (DISP-013, DISP-027)
-- Add notes field for assignment-level context
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE work_order_assignments
  ADD COLUMN IF NOT EXISTS notes TEXT;
