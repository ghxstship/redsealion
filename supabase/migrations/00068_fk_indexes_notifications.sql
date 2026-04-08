-- =============================================================================
-- Migration 00068: FK Constraints, Missing Indexes & Notifications Alignment
-- =============================================================================
-- 1. Adds proper FK constraints to equipment_id columns on rental_line_items
--    and shipment_line_items.
-- 2. Adds missing indexes on FK columns for query performance.
-- 3. Aligns notifications table with column superset used by app code.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. FK Constraints for dangling equipment_id columns
-- ─────────────────────────────────────────────────────────────────────

-- rental_line_items.equipment_id → assets(id)
ALTER TABLE rental_line_items
  ADD CONSTRAINT fk_rental_line_items_equipment
  FOREIGN KEY (equipment_id) REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rental_line_items_equipment
  ON rental_line_items(equipment_id) WHERE equipment_id IS NOT NULL;

-- shipment_line_items.equipment_id → assets(id)
ALTER TABLE shipment_line_items
  ADD CONSTRAINT fk_shipment_line_items_equipment
  FOREIGN KEY (equipment_id) REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shipment_line_items_equipment
  ON shipment_line_items(equipment_id) WHERE equipment_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────
-- 2. Missing FK indexes (production verticals)
-- ─────────────────────────────────────────────────────────────────────

-- shop_floor_logs → fabrication_orders
CREATE INDEX IF NOT EXISTS idx_shop_floor_logs_order
  ON shop_floor_logs(fabrication_order_id);

-- requisition_line_items → purchase_requisitions
CREATE INDEX IF NOT EXISTS idx_requisition_line_items_requisition
  ON requisition_line_items(requisition_id);

-- requisition_line_items → vendors
CREATE INDEX IF NOT EXISTS idx_requisition_line_items_vendor
  ON requisition_line_items(vendor_id) WHERE vendor_id IS NOT NULL;

-- requisition_line_items → purchase_orders
CREATE INDEX IF NOT EXISTS idx_requisition_line_items_po
  ON requisition_line_items(purchase_order_id) WHERE purchase_order_id IS NOT NULL;

-- goods_receipts → purchase_orders
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po
  ON goods_receipts(purchase_order_id);

-- schedule_blocks → parent_block_id (self-referencing)
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_parent
  ON schedule_blocks(parent_block_id) WHERE parent_block_id IS NOT NULL;

-- schedule_milestones → production_schedules
CREATE INDEX IF NOT EXISTS idx_schedule_milestones_schedule
  ON schedule_milestones(schedule_id);

-- rental_line_items → rental_orders
CREATE INDEX IF NOT EXISTS idx_rental_line_items_order
  ON rental_line_items(rental_order_id);

-- sub_rentals → rental_orders
CREATE INDEX IF NOT EXISTS idx_sub_rentals_rental_order
  ON sub_rentals(rental_order_id) WHERE rental_order_id IS NOT NULL;

-- sub_rentals → vendors
CREATE INDEX IF NOT EXISTS idx_sub_rentals_vendor
  ON sub_rentals(vendor_id) WHERE vendor_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────────────
-- 3. Notifications table column alignment
-- ─────────────────────────────────────────────────────────────────────
-- Migration 00032 creates the table with (body, entity_type, entity_id).
-- Migration 00060 attempts CREATE TABLE IF NOT EXISTS with different columns
-- (message, source_type, source_id, actor_id, actor_name, priority, action_url,
-- archived, read_at). Since 00032 runs first, those columns never get created.
-- App code uses columns from BOTH schemas.
-- Solution: add the missing columns from 00060 to the existing table.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS source_label TEXT,
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add the indexes from 00060 that may not exist yet
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(user_id, created_at DESC);
