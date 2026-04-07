-- ============================================================================
-- Asset Lifecycle Enrichment
-- Adds depreciation engine, disposal workflow, warranty/insurance tracking,
-- vendor linkage, revaluation history, and transition audit trail.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add lifecycle columns to assets
-- ---------------------------------------------------------------------------
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS warranty_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS warranty_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS warranty_provider text,
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS insurance_expiry_date timestamptz,
  ADD COLUMN IF NOT EXISTS disposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS disposal_method text CHECK (disposal_method IN ('sale', 'scrap', 'donate', 'transfer', 'write_off')),
  ADD COLUMN IF NOT EXISTS disposal_reason text,
  ADD COLUMN IF NOT EXISTS disposal_proceeds numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retired_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_usage_hours numeric(10,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Asset depreciation entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_depreciation_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  depreciation_amount numeric(12,2) NOT NULL,
  accumulated_depreciation numeric(12,2) NOT NULL,
  book_value numeric(12,2) NOT NULL,
  method text NOT NULL CHECK (method IN ('straight_line', 'declining_balance', 'declining_then_straight')),
  period_number int NOT NULL,
  is_posted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_depreciation_entries_asset ON asset_depreciation_entries(asset_id);
CREATE INDEX IF NOT EXISTS idx_depreciation_entries_org ON asset_depreciation_entries(organization_id);

-- ---------------------------------------------------------------------------
-- 3. Asset value history (revaluations, depreciation, impairment, disposal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_value_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  previous_value numeric(12,2),
  new_value numeric(12,2),
  change_type text NOT NULL CHECK (change_type IN ('depreciation', 'revaluation', 'impairment', 'disposal', 'acquisition')),
  reason text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_value_history_asset ON asset_value_history(asset_id);

-- ---------------------------------------------------------------------------
-- 4. Maintenance schedules (preventive maintenance engine)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  schedule_type text NOT NULL CHECK (schedule_type IN ('time_based', 'usage_based')),
  interval_days int,
  interval_usage int,
  last_triggered_at timestamptz,
  next_due_at timestamptz,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('preventive', 'inspection', 'calibration')),
  description text,
  estimated_duration_hours numeric(4,1),
  estimated_cost numeric(12,2),
  assigned_to text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_schedules_asset ON maintenance_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_maint_schedules_org ON maintenance_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_maint_schedules_due ON maintenance_schedules(next_due_at) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 5. Inventory counts (cycle counting / physical inventory)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  count_type text NOT NULL CHECK (count_type IN ('full', 'cycle', 'spot')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  counted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_count_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id uuid NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  expected_quantity int NOT NULL DEFAULT 1,
  counted_quantity int,
  variance int GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  condition_observed text,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_count_lines_count ON inventory_count_lines(count_id);

-- ---------------------------------------------------------------------------
-- 6. Asset audit log (all mutations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_source text NOT NULL DEFAULT 'manual' CHECK (change_source IN ('manual', 'api', 'scan', 'system', 'cron'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_asset ON asset_audit_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON asset_audit_log(organization_id);

-- ---------------------------------------------------------------------------
-- 7. RLS policies
-- ---------------------------------------------------------------------------
ALTER TABLE asset_depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_value_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audit_log ENABLE ROW LEVEL SECURITY;

-- Depreciation entries
CREATE POLICY "org_isolation_depreciation" ON asset_depreciation_entries
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

-- Value history
CREATE POLICY "org_isolation_value_history" ON asset_value_history
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

-- Maintenance schedules
CREATE POLICY "org_isolation_maint_schedules" ON maintenance_schedules
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

-- Inventory counts
CREATE POLICY "org_isolation_inv_counts" ON inventory_counts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

-- Inventory count lines (via join)
CREATE POLICY "org_isolation_inv_count_lines" ON inventory_count_lines
  FOR ALL USING (
    count_id IN (
      SELECT id FROM inventory_counts WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Asset audit log
CREATE POLICY "org_isolation_audit_log" ON asset_audit_log
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 8. Asset templates (reusable creation templates) — GAP-11
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'equipment',
  category text NOT NULL DEFAULT 'Other',
  default_depreciation_method text CHECK (default_depreciation_method IN ('straight_line', 'declining_balance', 'declining_then_straight')),
  default_useful_life_months int,
  default_fields jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_templates_org ON asset_templates(organization_id);

ALTER TABLE asset_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_asset_templates" ON asset_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );
