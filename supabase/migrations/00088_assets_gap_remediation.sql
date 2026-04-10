-- ============================================================================
-- Assets Gap Remediation
-- Addresses Critical/High/Medium schema gaps identified in the assets audit.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- C-2: Fix asset_location_history — API inserts from_location/to_location
-- which don't exist. Add them as nullable JSONB columns alongside the
-- existing `location` column.
-- ---------------------------------------------------------------------------
ALTER TABLE public.asset_location_history
  ADD COLUMN IF NOT EXISTS from_location JSONB,
  ADD COLUMN IF NOT EXISTS to_location JSONB;

-- ---------------------------------------------------------------------------
-- M-3: Add CHECK constraint on assets.depreciation_method to match the
-- depreciation engine's supported methods.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_assets_depreciation_method'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT chk_assets_depreciation_method
      CHECK (depreciation_method IS NULL OR depreciation_method IN (
        'straight_line', 'declining_balance', 'declining_then_straight'
      ));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- H-10: Add organization_id index on inventory_counts for RLS performance.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_inventory_counts_org
  ON public.inventory_counts(organization_id);

-- ---------------------------------------------------------------------------
-- M-10: Add explicit updated_at triggers for lifecycle tables created in
-- migration 00055 (the dynamic loop in 00001 only ran at initial schema time).
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON maintenance_schedules;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON asset_templates;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON asset_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- asset_depreciation_entries has no updated_at column, so no trigger needed.

-- ---------------------------------------------------------------------------
-- L-5 partial: Ensure the asset_status enum includes all states used by the
-- transition map. (Verified: planned, in_production, in_transit, deployed,
-- in_storage, retired, disposed are all in the enum from 00001.)
-- No action needed — this is a documentation checkpoint.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- H-9 partial: Verify asset_checkouts RLS policies use correct clauses.
-- The policies from 00066 exist, but ensure INSERT uses WITH CHECK.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop and recreate INSERT policy with correct WITH CHECK clause
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'asset_checkouts'
    AND policyname = 'org_insert_asset_checkouts'
  ) THEN
    DROP POLICY "org_insert_asset_checkouts" ON asset_checkouts;
  END IF;
END $$;

CREATE POLICY "org_insert_asset_checkouts" ON asset_checkouts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
    )
  );
