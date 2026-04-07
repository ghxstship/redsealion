-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 5: Location-Scoped Inventory
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_type TEXT DEFAULT 'warehouse',
  address JSONB,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE advance_inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES advance_catalog_variants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES advance_inventory_locations(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_incoming INTEGER DEFAULT 0,
  quantity_damaged INTEGER DEFAULT 0,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  last_counted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(variant_id, location_id)
);

CREATE TABLE advance_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES advance_catalog_variants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES advance_inventory_locations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inv_locations_org ON advance_inventory_locations(organization_id);
CREATE INDEX idx_inv_levels_variant ON advance_inventory_levels(variant_id);
CREATE INDEX idx_inv_levels_location ON advance_inventory_levels(location_id);
CREATE INDEX idx_inv_txn_variant ON advance_inventory_transactions(variant_id, created_at DESC);
