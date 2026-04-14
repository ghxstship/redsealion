-- Migration: 00145_advance_catalog_items_intelligence.sql

-- Specifications blob (shape varies by collection)
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

-- Pricing intelligence
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS msrp_usd INTEGER;
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS rental_rate_daily INTEGER;

-- Manufacturer/vendor identity
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS manufacturer_url TEXT;
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Lifecycle status
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS is_discontinued BOOLEAN DEFAULT false;
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS discontinued_date DATE;

-- Vendor availability (which rental houses / vendors stock this)
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS vendor_availability TEXT[] DEFAULT '{}';

-- Typical quantity range for production specs
ALTER TABLE advance_catalog_items ADD COLUMN IF NOT EXISTS typical_qty_range TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_catalog_items_manufacturer ON advance_catalog_items(manufacturer);
CREATE INDEX IF NOT EXISTS idx_catalog_items_msrp ON advance_catalog_items(msrp_usd);
CREATE INDEX IF NOT EXISTS idx_catalog_items_discontinued ON advance_catalog_items(is_discontinued);
CREATE INDEX IF NOT EXISTS idx_catalog_items_specs ON advance_catalog_items USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_catalog_items_vendors ON advance_catalog_items USING GIN(vendor_availability);
