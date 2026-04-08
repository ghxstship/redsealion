-- =============================================================================
-- Migration 00066: RLS Policies for Production Verticals, Logistics & Asset Checkouts
-- =============================================================================
-- Adds org-scoped RLS policies to 15 tables that had RLS enabled but zero
-- policies (data-access blackhole). Uses the canonical organization_memberships
-- pattern established in the Harbor Master layer.
-- =============================================================================

-- Helper: reuse user_org_ids() from 00037 for consistency
-- (SELECT user_org_ids()) returns all active org IDs for the authed user.

-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SCHEDULES
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_production_schedules" ON production_schedules
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_production_schedules" ON production_schedules
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_production_schedules" ON production_schedules
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_production_schedules" ON production_schedules
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- SCHEDULE BLOCKS (parent-join via production_schedules)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_schedule_blocks" ON schedule_blocks
  FOR SELECT USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_schedule_blocks" ON schedule_blocks
  FOR INSERT WITH CHECK (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_schedule_blocks" ON schedule_blocks
  FOR UPDATE USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_schedule_blocks" ON schedule_blocks
  FOR DELETE USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- SCHEDULE MILESTONES (parent-join via production_schedules)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_schedule_milestones" ON schedule_milestones
  FOR SELECT USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_schedule_milestones" ON schedule_milestones
  FOR INSERT WITH CHECK (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_schedule_milestones" ON schedule_milestones
  FOR UPDATE USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_schedule_milestones" ON schedule_milestones
  FOR DELETE USING (
    schedule_id IN (SELECT id FROM production_schedules WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- FABRICATION ORDERS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_fabrication_orders" ON fabrication_orders
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_fabrication_orders" ON fabrication_orders
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_fabrication_orders" ON fabrication_orders
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_fabrication_orders" ON fabrication_orders
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- BILL OF MATERIALS (parent-join via fabrication_orders)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_bom" ON bill_of_materials
  FOR SELECT USING (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_bom" ON bill_of_materials
  FOR INSERT WITH CHECK (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_bom" ON bill_of_materials
  FOR UPDATE USING (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_bom" ON bill_of_materials
  FOR DELETE USING (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- SHOP FLOOR LOGS (parent-join via fabrication_orders)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_shop_floor_logs" ON shop_floor_logs
  FOR SELECT USING (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_shop_floor_logs" ON shop_floor_logs
  FOR INSERT WITH CHECK (
    fabrication_order_id IN (SELECT id FROM fabrication_orders WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- PURCHASE REQUISITIONS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_purchase_requisitions" ON purchase_requisitions
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_purchase_requisitions" ON purchase_requisitions
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_purchase_requisitions" ON purchase_requisitions
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_purchase_requisitions" ON purchase_requisitions
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- REQUISITION LINE ITEMS (parent-join via purchase_requisitions)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_requisition_line_items" ON requisition_line_items
  FOR SELECT USING (
    requisition_id IN (SELECT id FROM purchase_requisitions WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_requisition_line_items" ON requisition_line_items
  FOR INSERT WITH CHECK (
    requisition_id IN (SELECT id FROM purchase_requisitions WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_requisition_line_items" ON requisition_line_items
  FOR UPDATE USING (
    requisition_id IN (SELECT id FROM purchase_requisitions WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_requisition_line_items" ON requisition_line_items
  FOR DELETE USING (
    requisition_id IN (SELECT id FROM purchase_requisitions WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- GOODS RECEIPTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_goods_receipts" ON goods_receipts
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_goods_receipts" ON goods_receipts
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_goods_receipts" ON goods_receipts
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- RENTAL ORDERS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_rental_orders" ON rental_orders
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_rental_orders" ON rental_orders
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_rental_orders" ON rental_orders
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_rental_orders" ON rental_orders
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- RENTAL LINE ITEMS (parent-join via rental_orders)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_rental_line_items" ON rental_line_items
  FOR SELECT USING (
    rental_order_id IN (SELECT id FROM rental_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_rental_line_items" ON rental_line_items
  FOR INSERT WITH CHECK (
    rental_order_id IN (SELECT id FROM rental_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_rental_line_items" ON rental_line_items
  FOR UPDATE USING (
    rental_order_id IN (SELECT id FROM rental_orders WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_rental_line_items" ON rental_line_items
  FOR DELETE USING (
    rental_order_id IN (SELECT id FROM rental_orders WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- SUB-RENTALS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_sub_rentals" ON sub_rentals
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_sub_rentals" ON sub_rentals
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_sub_rentals" ON sub_rentals
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_sub_rentals" ON sub_rentals
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- SHIPMENTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_shipments" ON shipments
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_shipments" ON shipments
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_shipments" ON shipments
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_shipments" ON shipments
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));

-- ═══════════════════════════════════════════════════════════════════════
-- SHIPMENT LINE ITEMS (parent-join via shipments)
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_shipment_line_items" ON shipment_line_items
  FOR SELECT USING (
    shipment_id IN (SELECT id FROM shipments WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_insert_shipment_line_items" ON shipment_line_items
  FOR INSERT WITH CHECK (
    shipment_id IN (SELECT id FROM shipments WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_update_shipment_line_items" ON shipment_line_items
  FOR UPDATE USING (
    shipment_id IN (SELECT id FROM shipments WHERE organization_id IN (SELECT user_org_ids()))
  );
CREATE POLICY "org_delete_shipment_line_items" ON shipment_line_items
  FOR DELETE USING (
    shipment_id IN (SELECT id FROM shipments WHERE organization_id IN (SELECT user_org_ids()))
  );

-- ═══════════════════════════════════════════════════════════════════════
-- ASSET CHECKOUTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "org_read_asset_checkouts" ON asset_checkouts
  FOR SELECT USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_insert_asset_checkouts" ON asset_checkouts
  FOR INSERT WITH CHECK (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_update_asset_checkouts" ON asset_checkouts
  FOR UPDATE USING (organization_id IN (SELECT user_org_ids()));
CREATE POLICY "org_delete_asset_checkouts" ON asset_checkouts
  FOR DELETE USING (organization_id IN (SELECT user_org_ids()));
