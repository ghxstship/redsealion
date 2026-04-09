-- ═══════════════════════════════════════════════════════════
-- Critical Gap Remediation: C-01, C-02, C-04, H-03, H-05, H-06, L-02
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- C-01: Add `created_by` column to production_advances
-- workflow.ts and duplicate/route.ts reference this column
-- ─────────────────────────────────────────────────────────

ALTER TABLE production_advances
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

COMMENT ON COLUMN production_advances.created_by IS 'User who originally created this advance (distinct from submitted_by who may be different in collection mode)';

-- Backfill: set created_by = submitted_by for existing rows
UPDATE production_advances SET created_by = submitted_by WHERE created_by IS NULL AND submitted_by IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- C-02: Fix broken RLS policies in migration 00078
-- 00078 used "organization_members" — correct table is "organization_memberships"
-- ─────────────────────────────────────────────────────────

-- Drop broken policies
DROP POLICY IF EXISTS "advance_attachments_org" ON advance_attachments;
DROP POLICY IF EXISTS "budget_org" ON advance_budget_allocations;
DROP POLICY IF EXISTS "vendor_quotes_org" ON advance_vendor_quotes;

-- Recreate with correct table name
CREATE POLICY "advance_attachments_org" ON advance_attachments FOR ALL
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

CREATE POLICY "budget_org" ON advance_budget_allocations FOR ALL
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

CREATE POLICY "vendor_quotes_org" ON advance_vendor_quotes FOR ALL
  USING (organization_id IN (
    SELECT om.organization_id FROM organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  ));

-- ─────────────────────────────────────────────────────────
-- C-04: Add category slug columns to advance_line_items
-- Duplicate, export, batch insert, and template routes reference these
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS category_group_slug TEXT,
  ADD COLUMN IF NOT EXISTS category_slug TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;

COMMENT ON COLUMN advance_line_items.category_group_slug IS 'Denormalized slug from advance_category_groups for filtering/display';
COMMENT ON COLUMN advance_line_items.category_slug IS 'Denormalized slug from advance_categories for filtering/display';
COMMENT ON COLUMN advance_line_items.subcategory_slug IS 'Denormalized slug from advance_subcategories for filtering/display';

-- ─────────────────────────────────────────────────────────
-- H-03: Enable RLS on advance_catalog_item_images
-- Table was created in 00078 without RLS
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_catalog_item_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_images_org_select" ON advance_catalog_item_images FOR SELECT
  USING (catalog_item_id IN (
    SELECT ci.id FROM advance_catalog_items ci
    WHERE ci.organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  ));

CREATE POLICY "catalog_images_org_manage" ON advance_catalog_item_images FOR ALL
  USING (catalog_item_id IN (
    SELECT ci.id FROM advance_catalog_items ci
    WHERE ci.organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  ));

-- ─────────────────────────────────────────────────────────
-- H-05: Auto-generate advance_number on INSERT when NULL
-- Currently only works when called explicitly via API
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auto_advance_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.advance_number IS NULL OR NEW.advance_number = '' THEN
    NEW.advance_number := generate_advance_number(NEW.organization_id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_advance_number ON production_advances;
CREATE TRIGGER trg_auto_advance_number
  BEFORE INSERT ON production_advances
  FOR EACH ROW
  EXECUTE FUNCTION auto_advance_number();

-- ─────────────────────────────────────────────────────────
-- H-06: Auto-compute line_total_cents on INSERT/UPDATE
-- Currently only computed client-side in utils.ts
-- ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_line_total() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_price_cents IS NOT NULL THEN
    NEW.line_total_cents := (NEW.quantity * NEW.unit_price_cents)
      + COALESCE(NEW.modifier_total_cents, 0)
      - COALESCE(NEW.discount_cents, 0);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_line_total ON advance_line_items;
CREATE TRIGGER trg_compute_line_total
  BEFORE INSERT OR UPDATE ON advance_line_items
  FOR EACH ROW
  EXECUTE FUNCTION compute_line_total();

-- ─────────────────────────────────────────────────────────
-- L-02: Add updated_at trigger to advance_comments
-- ─────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_advance_comments_updated ON advance_comments;
CREATE TRIGGER trg_advance_comments_updated
  BEFORE UPDATE ON advance_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────
-- M-01: Add INSERT policy to advance_status_history
-- Only SELECT policy existed; INSERT needed for manual history entries
-- ─────────────────────────────────────────────────────────

CREATE POLICY status_history_org_insert ON advance_status_history FOR INSERT
  WITH CHECK (
    advance_id IN (SELECT pa.id FROM production_advances pa WHERE pa.organization_id IN (
      SELECT om.organization_id FROM organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    ))
  );
