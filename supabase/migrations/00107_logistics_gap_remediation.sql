-- =============================================================================
-- Migration 00106: Logistics Module Gap Remediation
-- =============================================================================
-- Fixes Critical + High + Medium schema gaps identified in the Logistics audit.
-- Covers: shipments, warehouse_transfers, inventory_counts, packing_lists
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1. ADD 'reconciled' TO inventory_counts STATUS CHECK (C-4)
-- ═══════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Drop old CHECK constraint on status
  EXECUTE (
    SELECT format('ALTER TABLE inventory_counts DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'inventory_counts' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE inventory_counts
  ADD CONSTRAINT inventory_counts_status_check
  CHECK (status IN ('planned', 'in_progress', 'completed', 'reconciled', 'cancelled'));


-- ═══════════════════════════════════════════════════════════════════════
-- 2. ADD updated_at TO inventory_counts (M-3)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE inventory_counts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_inventory_counts ON inventory_counts;
CREATE TRIGGER set_updated_at_inventory_counts
  BEFORE UPDATE ON inventory_counts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 3. SOFT-DELETE: warehouse_transfers + shipments (M-1, M-2)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE warehouse_transfers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_active
  ON warehouse_transfers(organization_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shipments_active
  ON shipments(organization_id) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. UNIQUENESS: shipment_number per org (H-10)
-- ═══════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_shipments_number'
  ) THEN
    ALTER TABLE shipments
      ADD CONSTRAINT uq_shipments_number UNIQUE (organization_id, shipment_number);
  END IF;
END$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. ADD weight_lbs TO shipment_line_items (M-9)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE shipment_line_items
  ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. CREATE packing_lists PARENT TABLE (H-7)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS packing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Packing List',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packing_lists_select" ON packing_lists FOR SELECT
  USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "packing_lists_insert" ON packing_lists FOR INSERT
  WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "packing_lists_update" ON packing_lists FOR UPDATE
  USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "packing_lists_delete" ON packing_lists FOR DELETE
  USING (organization_id IN (SELECT user_org_ids()));

CREATE INDEX IF NOT EXISTS idx_packing_lists_org ON packing_lists(organization_id);
CREATE INDEX IF NOT EXISTS idx_packing_lists_proposal ON packing_lists(proposal_id) WHERE proposal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packing_lists_event ON packing_lists(event_id) WHERE event_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at_packing_lists ON packing_lists;
CREATE TRIGGER set_updated_at_packing_lists
  BEFORE UPDATE ON packing_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Add packing_list_id FK to packing_list_items + event/shipment FKs (M-4)
ALTER TABLE packing_list_items
  ADD COLUMN IF NOT EXISTS packing_list_id UUID REFERENCES packing_lists(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_packing_list_items_list ON packing_list_items(packing_list_id)
  WHERE packing_list_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 7. SPLIT warehouse_transfer_items RLS (L-5)
-- ═══════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "transfer_items_org_access" ON warehouse_transfer_items;

CREATE POLICY "transfer_items_select" ON warehouse_transfer_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    WHERE wt.id = transfer_id AND wt.organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "transfer_items_insert" ON warehouse_transfer_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    WHERE wt.id = transfer_id AND wt.organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "transfer_items_update" ON warehouse_transfer_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    WHERE wt.id = transfer_id AND wt.organization_id IN (SELECT user_org_ids())
  ));

CREATE POLICY "transfer_items_delete" ON warehouse_transfer_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM warehouse_transfers wt
    WHERE wt.id = transfer_id AND wt.organization_id IN (SELECT user_org_ids())
  ));
