-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 8: Line Items
-- ═══════════════════════════════════════════════════════════

CREATE TABLE advance_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advance_id UUID NOT NULL REFERENCES production_advances(id) ON DELETE CASCADE,

  -- ═══ WHO SUBMITTED THIS LINE ITEM ═══
  submitted_by_user_id UUID REFERENCES users(id),
  submitted_by_org_id UUID REFERENCES organizations(id),
  collaborator_id UUID REFERENCES advance_collaborators(id),

  -- ═══ CATALOG REFERENCE (nullable for ad-hoc) ═══
  catalog_item_id UUID REFERENCES advance_catalog_items(id) ON DELETE SET NULL,
  catalog_variant_id UUID REFERENCES advance_catalog_variants(id) ON DELETE SET NULL,

  -- ═══ SNAPSHOT (immutable after submission) ═══
  item_name TEXT NOT NULL,
  item_code VARCHAR(20),
  variant_name TEXT,
  variant_sku VARCHAR(50),
  item_description TEXT,
  specifications_snapshot JSONB DEFAULT '{}',

  -- ═══ CONFIGURATION ═══
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_of_measure unit_of_measure DEFAULT 'day',
  make_model TEXT,
  selected_modifiers JSONB DEFAULT '[]',

  -- ═══ DATES ═══
  service_start_date DATE,
  service_end_date DATE,
  load_in_date DATE,
  strike_date DATE,

  -- ═══ NOTES ═══
  purpose TEXT,
  special_considerations TEXT,
  notes TEXT,
  special_request TEXT,

  -- ═══ PRICING ═══
  unit_price_cents INTEGER,
  modifier_total_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  line_total_cents INTEGER,

  -- ═══ FULFILLMENT (per-item) ═══
  fulfillment_status fulfillment_status DEFAULT 'pending',
  fulfillment_type fulfillment_type,
  assigned_vendor_id UUID REFERENCES client_contacts(id),
  assigned_user_id UUID REFERENCES users(id),
  assigned_location_id UUID REFERENCES advance_inventory_locations(id),
  tracking_number TEXT,
  vendor_confirmation_number TEXT,
  expected_delivery_at TIMESTAMPTZ,
  actual_delivery_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  damage_report JSONB,

  -- ═══ INTERNAL ═══
  internal_notes TEXT,
  revenue_category TEXT,
  sort_order INTEGER DEFAULT 0,

  -- ═══ APPROVAL (per-line-item for collection mode) ═══
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_line_items_advance ON advance_line_items(advance_id);
CREATE INDEX idx_line_items_collaborator ON advance_line_items(collaborator_id);
CREATE INDEX idx_line_items_submitted_by ON advance_line_items(submitted_by_user_id);
CREATE INDEX idx_line_items_fulfillment ON advance_line_items(advance_id, fulfillment_status);
CREATE INDEX idx_line_items_approval ON advance_line_items(advance_id, approval_status);
