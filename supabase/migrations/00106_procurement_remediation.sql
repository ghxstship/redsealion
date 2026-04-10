-- =============================================================================
-- Migration 00105: Procurement Module Gap Remediation
-- =============================================================================
-- Addresses schema gaps GAP-PROC-003, 007, 012, 017, 018, 020, 023, 024, 029
-- from the Procurement Operational Gap Audit.
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- 1. GOODS_RECEIPTS: Missing Columns (GAP-PROC-003, 017, 029)
--    API inserts receipt_number + items which don't exist.
--    Also missing updated_at and deleted_at.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE goods_receipts
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_goods_receipts_active
  ON goods_receipts(organization_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_updated_at_goods_receipts ON goods_receipts;
CREATE TRIGGER set_updated_at_goods_receipts
  BEFORE UPDATE ON goods_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════
-- 2. GOODS_RECEIPTS: Missing DELETE RLS Policy (GAP-PROC-018)
-- ═══════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE POLICY "org_delete_goods_receipts" ON goods_receipts
    FOR DELETE USING (organization_id IN (SELECT user_org_ids()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. PURCHASE_ORDERS: Expand status CHECK + UNIQUE po_number
--    (GAP-PROC-007, 020)
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing constraint and re-create with partially_received
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

DO $$ BEGIN
  ALTER TABLE purchase_orders
    ADD CONSTRAINT purchase_orders_status_check
    CHECK (status IN (
      'draft', 'sent', 'acknowledged', 'approved',
      'partially_received', 'received', 'closed', 'cancelled'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unique PO number per org
DO $$ BEGIN
  ALTER TABLE purchase_orders
    ADD CONSTRAINT uq_po_number UNIQUE (organization_id, po_number);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 4. PURCHASE_REQUISITIONS: soft-delete + approved_at (GAP-PROC-023, 024)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE purchase_requisitions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_active
  ON purchase_requisitions(organization_id) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. GOODS_RECEIPT_LINE_ITEMS: Item-level Receiving (GAP-PROC-012)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS goods_receipt_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  po_line_item_id UUID REFERENCES purchase_order_line_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity_ordered NUMERIC(14,2) NOT NULL DEFAULT 0,
  quantity_received NUMERIC(14,2) NOT NULL DEFAULT 0,
  quantity_rejected NUMERIC(14,2) NOT NULL DEFAULT 0,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective', 'wrong_item')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gr_line_items_receipt ON goods_receipt_line_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_gr_line_items_po_line ON goods_receipt_line_items(po_line_item_id)
  WHERE po_line_item_id IS NOT NULL;

ALTER TABLE goods_receipt_line_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "org_view_gr_line_items" ON goods_receipt_line_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM goods_receipts gr
        WHERE gr.id = receipt_id
        AND gr.organization_id IN (SELECT user_org_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "org_manage_gr_line_items" ON goods_receipt_line_items
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM goods_receipts gr
        WHERE gr.id = receipt_id
        AND gr.organization_id IN (SELECT user_org_ids())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_gr_line_items ON goods_receipt_line_items;
CREATE TRIGGER set_updated_at_gr_line_items
  BEFORE UPDATE ON goods_receipt_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
