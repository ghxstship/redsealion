-- Migration: High-gap remediation schema changes
-- RNT-07/08: Rental return condition tracking
-- PRP-04: Proposal sent/viewed timestamps
-- FAB-04: Fabrication lifecycle timestamps

-- ============================================
-- RNT-07/08: Return condition fields on rental_line_items
-- ============================================
ALTER TABLE rental_line_items
  ADD COLUMN IF NOT EXISTS return_condition text,
  ADD COLUMN IF NOT EXISTS return_date timestamptz,
  ADD COLUMN IF NOT EXISTS damage_notes text,
  ADD COLUMN IF NOT EXISTS inspected_by uuid REFERENCES users(id);

COMMENT ON COLUMN rental_line_items.return_condition IS 'Condition on return: good, fair, damaged, lost';
COMMENT ON COLUMN rental_line_items.return_date IS 'When the item was actually returned';
COMMENT ON COLUMN rental_line_items.damage_notes IS 'Freeform damage description for insurance/billing';
COMMENT ON COLUMN rental_line_items.inspected_by IS 'User who inspected the return';

-- ============================================
-- PRP-04: Proposal tracking timestamps
-- ============================================
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS viewed_count integer DEFAULT 0;

COMMENT ON COLUMN proposals.sent_at IS 'When proposal was first sent to client';
COMMENT ON COLUMN proposals.last_viewed_at IS 'Last time client opened the proposal';
COMMENT ON COLUMN proposals.viewed_count IS 'Number of times client viewed the proposal';

-- ============================================
-- FAB-04: Fabrication lifecycle timestamps
-- ============================================
ALTER TABLE fabrication_orders
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS qc_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

COMMENT ON COLUMN fabrication_orders.started_at IS 'When production started';
COMMENT ON COLUMN fabrication_orders.qc_started_at IS 'When quality check began';
COMMENT ON COLUMN fabrication_orders.completed_at IS 'When order was completed and approved';
COMMENT ON COLUMN fabrication_orders.cancelled_at IS 'When order was cancelled';

-- ============================================
-- Integration sync error log table (INT-02)
-- ============================================
CREATE TABLE IF NOT EXISTS integration_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  entity_type text NOT NULL DEFAULT 'unknown',
  entity_id text,
  status text NOT NULL DEFAULT 'error',
  error_message text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_sync_log_org
  ON integration_sync_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_status
  ON integration_sync_log(organization_id, status);

ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "org members can view sync logs" ON integration_sync_log;
  CREATE POLICY "org members can view sync logs" ON integration_sync_log
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Expense receipts table (EXP-01)
-- ============================================
CREATE TABLE IF NOT EXISTS expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_expense
  ON expense_receipts(expense_id);

ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "org members can manage receipts" ON expense_receipts;
  CREATE POLICY "org members can manage receipts" ON expense_receipts
    FOR ALL USING (
      expense_id IN (
        SELECT id FROM expenses WHERE organization_id IN (
          SELECT organization_id FROM organization_memberships
          WHERE user_id = auth.uid()
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Custom reports table (RPT-02)
-- ============================================
CREATE TABLE IF NOT EXISTS custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  report_type text NOT NULL DEFAULT 'custom',
  config jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_org
  ON custom_reports(organization_id);

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "org members can manage reports" ON custom_reports;
  CREATE POLICY "org members can manage reports" ON custom_reports
    FOR ALL USING (
      organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Fabrication lifecycle trigger
-- ============================================
CREATE OR REPLACE FUNCTION set_fabrication_lifecycle_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE NEW.status
      WHEN 'in_production' THEN
        NEW.started_at := COALESCE(NEW.started_at, now());
      WHEN 'quality_check' THEN
        NEW.qc_started_at := COALESCE(NEW.qc_started_at, now());
      WHEN 'completed' THEN
        NEW.completed_at := COALESCE(NEW.completed_at, now());
      WHEN 'cancelled' THEN
        NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fabrication_lifecycle ON fabrication_orders;
CREATE TRIGGER trg_fabrication_lifecycle
  BEFORE UPDATE ON fabrication_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_fabrication_lifecycle_timestamps();
