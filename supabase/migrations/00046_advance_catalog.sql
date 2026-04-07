-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 3: Catalog Items & Variants
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES advance_subcategories(id) ON DELETE CASCADE,

  -- Identity
  item_code VARCHAR(20) NOT NULL,
  sku_prefix VARCHAR(30),
  name TEXT NOT NULL,
  display_name TEXT,
  related_names TEXT[] DEFAULT '{}',
  description TEXT,
  short_description VARCHAR(300),

  -- Classification
  product_type TEXT DEFAULT 'standard',
  procurement_method procurement_method DEFAULT 'rent',
  tax_class TEXT DEFAULT 'standard',
  revenue_category TEXT,

  -- Variant Config
  variant_attributes JSONB DEFAULT '[]',
  has_variants BOOLEAN DEFAULT false,

  -- Pricing Defaults
  pricing_strategy pricing_strategy DEFAULT 'fixed',
  default_unit_of_measure unit_of_measure DEFAULT 'day',
  currency_code VARCHAR(3) DEFAULT 'USD',

  -- Media
  image_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- Specifications
  specifications JSONB DEFAULT '{}',

  -- Dependencies
  prerequisites TEXT[] DEFAULT '{}',
  recommended_items UUID[] DEFAULT '{}',
  bundle_components JSONB DEFAULT '[]',

  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  is_discountable BOOLEAN DEFAULT true,
  is_trackable BOOLEAN DEFAULT true,
  is_shared_catalog BOOLEAN DEFAULT false,

  -- Search
  search_vector TSVECTOR,

  -- Versioning
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, item_code)
);

CREATE INDEX idx_catalog_items_search ON advance_catalog_items USING gin(search_vector);
CREATE INDEX idx_catalog_items_subcategory ON advance_catalog_items(subcategory_id);
CREATE INDEX idx_catalog_items_active ON advance_catalog_items(organization_id, is_active);
CREATE INDEX idx_catalog_items_shared ON advance_catalog_items(organization_id, is_shared_catalog)
  WHERE is_shared_catalog = true;

-- Auto-generate search vector
CREATE FUNCTION catalog_item_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.related_names, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_catalog_item_search
  BEFORE INSERT OR UPDATE ON advance_catalog_items
  FOR EACH ROW EXECUTE FUNCTION catalog_item_search_vector();

-- ═══════════════════════════════════════════════════════════
-- Catalog Variants — The Orderable Unit
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_catalog_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES advance_catalog_items(id) ON DELETE CASCADE,

  -- Identity
  sku VARCHAR(50),
  barcode VARCHAR(50),
  name TEXT NOT NULL,
  option_values JSONB DEFAULT '{}',

  -- Pricing
  pricing_strategy pricing_strategy DEFAULT 'fixed',
  price_cents INTEGER,
  compare_at_price_cents INTEGER,
  cost_cents INTEGER,
  price_tiers JSONB DEFAULT '[]',

  -- Unit
  unit_of_measure unit_of_measure DEFAULT 'day',
  minimum_order_quantity INTEGER DEFAULT 1,
  maximum_order_quantity INTEGER,
  increment_quantity INTEGER DEFAULT 1,

  -- Fulfillment
  requires_shipping BOOLEAN DEFAULT true,
  weight_grams INTEGER,
  dimensions JSONB,
  lead_time_hours INTEGER,

  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_sellable BOOLEAN DEFAULT true,
  is_stockable BOOLEAN DEFAULT true,

  -- Versioning
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(organization_id, sku)
);

CREATE INDEX idx_variants_item ON advance_catalog_variants(item_id);
CREATE INDEX idx_variants_sku ON advance_catalog_variants(sku);
