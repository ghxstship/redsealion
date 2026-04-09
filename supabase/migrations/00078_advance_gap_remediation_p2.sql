-- ═══════════════════════════════════════════════════════════
-- Gap Remediation Phase 2: Medium & Low Priority
-- M-03, M-09, H-03, H-19, T-01, T-03, T-04, T-05, T-06
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- M-03: Full-text search vector on production_advances
-- ─────────────────────────────────────────────────────────

ALTER TABLE production_advances
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION update_advance_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.advance_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.event_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.venue_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.purpose, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.contact_name, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.company_name, '')), 'C');
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_advance_search_vector ON production_advances;
CREATE TRIGGER trg_advance_search_vector
  BEFORE INSERT OR UPDATE ON production_advances
  FOR EACH ROW
  EXECUTE FUNCTION update_advance_search_vector();

CREATE INDEX IF NOT EXISTS idx_advances_search ON production_advances USING GIN (search_vector);

-- ─────────────────────────────────────────────────────────
-- H-19: WiFi/IT items — network specification fields
-- ─────────────────────────────────────────────────────────

ALTER TABLE advance_line_items
  ADD COLUMN IF NOT EXISTS network_name TEXT,
  ADD COLUMN IF NOT EXISTS network_purpose TEXT,
  ADD COLUMN IF NOT EXISTS bandwidth_mbps INTEGER;

COMMENT ON COLUMN advance_line_items.network_name IS 'e.g., "Salvage City Production"';
COMMENT ON COLUMN advance_line_items.network_purpose IS 'e.g., "Ticketing + Backup"';

-- ─────────────────────────────────────────────────────────
-- T-03: Catalog item images
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advance_catalog_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_images_item ON advance_catalog_item_images(catalog_item_id);

-- ─────────────────────────────────────────────────────────
-- T-04: File attachments on advances and line items
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES advance_line_items(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_advance ON advance_attachments(advance_id);
ALTER TABLE advance_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "advance_attachments_org" ON advance_attachments
  USING (organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────
-- T-05: Budget allocations per advance type / category group
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advance_budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  category_group_id UUID REFERENCES advance_category_groups(id),
  advance_type TEXT,
  budget_name TEXT NOT NULL,
  allocated_cents INTEGER NOT NULL DEFAULT 0,
  spent_cents INTEGER NOT NULL DEFAULT 0,
  remaining_cents INTEGER GENERATED ALWAYS AS (allocated_cents - spent_cents) STORED,
  fiscal_year INTEGER,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_org ON advance_budget_allocations(organization_id);
ALTER TABLE advance_budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_org" ON advance_budget_allocations
  USING (organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────
-- T-06: Vendor quotes per line item
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS advance_vendor_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  line_item_id UUID NOT NULL REFERENCES advance_line_items(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_contact_email TEXT,
  vendor_contact_phone TEXT,
  quote_number TEXT,
  quoted_unit_price_cents INTEGER,
  quoted_total_cents INTEGER,
  quote_valid_until DATE,
  quote_document_url TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('requested', 'received', 'accepted', 'rejected', 'expired')),
  notes TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_quotes_item ON advance_vendor_quotes(line_item_id);
ALTER TABLE advance_vendor_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendor_quotes_org" ON advance_vendor_quotes
  USING (organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()));
