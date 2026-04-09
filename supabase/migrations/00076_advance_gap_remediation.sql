-- ═══════════════════════════════════════════════════════════
-- Gap Remediation: Advancing Hub
-- Fixes: C-04, C-10, L-01, L-02, H-08, H-18
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- C-04: Fix recalculate_advance_totals() — total_cents was never computed
-- Only subtotal_cents was updated; total_cents stayed at 0
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_advance_totals() RETURNS TRIGGER AS $$
DECLARE
  _advance_id UUID;
  _subtotal   INTEGER;
  _tax        INTEGER;
  _discount   INTEGER;
  _count      INTEGER;
BEGIN
  _advance_id := COALESCE(NEW.advance_id, OLD.advance_id);

  SELECT COALESCE(SUM(line_total_cents), 0),
         COALESCE(SUM(tax_cents), 0),
         COALESCE(SUM(discount_cents), 0),
         COUNT(*)
    INTO _subtotal, _tax, _discount, _count
    FROM advance_line_items
   WHERE advance_id = _advance_id;

  UPDATE production_advances SET
    subtotal_cents       = _subtotal,
    tax_total_cents      = _tax,
    discount_total_cents = _discount,
    line_item_count      = _count,
    total_cents          = _subtotal + _tax - _discount,
    updated_at           = now()
  WHERE id = _advance_id;

  RETURN COALESCE(NEW, OLD);
END; $$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- C-10: Multi-date ranges for discontinuous scheduling
-- "5/9-5/11 & 5/18-5/19" pattern
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS service_date_ranges JSONB DEFAULT '[]';

COMMENT ON COLUMN advance_line_items.service_date_ranges IS
  'Array of {start, end} for discontinuous scheduling: [{"start":"2026-05-09","end":"2026-05-11"}]';

-- ─────────────────────────────────────────────────────────
-- L-01: is_existing flag ("Existing on CAD")
-- L-02: is_tentative flag ("Possible reduction TBC")
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS is_existing  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_tentative BOOLEAN DEFAULT false;

COMMENT ON COLUMN advance_line_items.is_existing  IS 'Item already on-site or previously provisioned';
COMMENT ON COLUMN advance_line_items.is_tentative IS 'Quantity or config pending confirmation (TBC)';

-- ─────────────────────────────────────────────────────────
-- H-18: Labor/shift scheduling fields
-- Security Guards: "(2) 24 Hours, (2) Event Coverage"
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS shift_type  TEXT,
  ADD COLUMN IF NOT EXISTS hours_per_day DECIMAL,
  ADD COLUMN IF NOT EXISTS headcount   INTEGER;

-- ─────────────────────────────────────────────────────────
-- H-08: Structured power requirements
-- "200 Amps — 3 Phase", "480V/60Hz", "17kW"
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS power_requirements JSONB;

COMMENT ON COLUMN advance_line_items.power_requirements IS
  '{"voltage":120,"hertz":60,"phase":1,"amperage":15,"wattage":1800}';

-- ─────────────────────────────────────────────────────────
-- M-01: Soft deletes on core tables
-- ─────────────────────────────────────────────────────────

ALTER TABLE production_advances
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE advance_collaborators
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────
-- H-12: Apply optimistic locking trigger to production_advances
-- (was only on catalog tables, not on the advance itself)
-- ─────────────────────────────────────────────────────────

CREATE TRIGGER trg_production_advances_version
  BEFORE UPDATE ON production_advances
  FOR EACH ROW
  WHEN (NEW.version IS DISTINCT FROM OLD.version)
  EXECUTE FUNCTION advance_check_version();
