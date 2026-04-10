-- ============================================================================
-- Equipment Remediation (Gap Fixes)
-- Addresses missing tables, columns, constraints and triggers for Equipment Module
-- ============================================================================

-- ---------------------------------------------------------------------------
-- GAP 2 & 3: Fix bundle structures
-- Add `category` to equipment_bundles. Default 'General'.
-- Add `equipment_bundle_items` table.
-- ---------------------------------------------------------------------------
ALTER TABLE public.equipment_bundles
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'General';

CREATE TABLE IF NOT EXISTS public.equipment_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.equipment_bundles(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_bundle_items_bundle ON equipment_bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_equipment_bundle_items_asset ON equipment_bundle_items(asset_id);

ALTER TABLE public.equipment_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_equipment_bundle_items" ON public.equipment_bundle_items
  FOR ALL USING (
    bundle_id IN (
      SELECT id FROM public.equipment_bundles 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_memberships WHERE user_id = auth.uid()
      )
    )
  );

-- Migrate old JSONB items to new table
DO $$
DECLARE
  bundle RECORD;
  item_id text;
BEGIN
  FOR bundle IN SELECT id, items FROM public.equipment_bundles WHERE jsonb_typeof(items) = 'array' LOOP
    FOR item_id IN SELECT jsonb_array_elements_text(bundle.items) LOOP
      BEGIN
        INSERT INTO public.equipment_bundle_items (bundle_id, asset_id, quantity)
        VALUES (bundle.id, item_id::uuid, 1)
        ON CONFLICT DO NOTHING;
      EXCEPTION WHEN OTHERS THEN
        -- Ignore casting issues or missing assets
      END;
    END LOOP;
  END LOOP;
END $$;


-- ---------------------------------------------------------------------------
-- GAP 6: maintenance_schedules.assigned_to 
-- Needs to be an auth.users or public.users relation. Currently it's text.
-- ---------------------------------------------------------------------------
ALTER TABLE public.maintenance_schedules
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;


-- ---------------------------------------------------------------------------
-- GAP 8: sync_asset_condition_on_maintenance_complete logic
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_asset_condition_on_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' AND OLD.status != 'complete' THEN
    -- A maintenance ticket just got completed
    UPDATE public.assets
    SET condition = 'good', status = 'available'
    WHERE id = NEW.asset_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_asset_condition ON public.maintenance_records;
CREATE TRIGGER trg_sync_asset_condition
  AFTER UPDATE OF status ON public.maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION sync_asset_condition_on_maintenance();
