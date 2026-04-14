-- Migration: 00146_advance_intelligence_rls.sql

ALTER TABLE advance_catalog_item_interchange ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_catalog_item_supersession ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_fitment_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_catalog_item_fitment ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
CREATE POLICY "interchange_read" ON advance_catalog_item_interchange
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "supersession_read" ON advance_catalog_item_supersession
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fitment_dims_read" ON advance_fitment_dimensions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fitment_read" ON advance_catalog_item_fitment
  FOR SELECT TO authenticated USING (true);

-- Write: admin, owner roles (Harbor Master — via organization_memberships + roles)
CREATE POLICY "interchange_write" ON advance_catalog_item_interchange
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('admin','owner','developer')
    )
  );
CREATE POLICY "supersession_write" ON advance_catalog_item_supersession
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('admin','owner','developer')
    )
  );
CREATE POLICY "fitment_dims_write" ON advance_fitment_dimensions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('admin','owner','developer')
    )
  );
CREATE POLICY "fitment_write" ON advance_catalog_item_fitment
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid()
        AND om.status = 'active'
        AND r.name IN ('admin','owner','developer')
    )
  );
