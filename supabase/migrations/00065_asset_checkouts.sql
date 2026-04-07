-- Asset Checkouts: SSOT for all asset custody changes (rentals + production)
-- Every check-out and check-in is a transaction row, creating full chain of custody.
CREATE TABLE IF NOT EXISTS asset_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  -- Context: what is this checkout FOR? (nullable polymorphic FKs — 3NF compliant)
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rental_order_id UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  -- Custody
  checked_out_by UUID REFERENCES users(id),
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES users(id),
  checked_in_at TIMESTAMPTZ,
  -- Condition tracking
  condition_out TEXT NOT NULL DEFAULT 'good' CHECK (condition_out IN ('new', 'good', 'fair', 'damaged')),
  condition_in TEXT CHECK (condition_in IN ('new', 'good', 'fair', 'damaged', 'lost')),
  -- Logistics
  quantity INT NOT NULL DEFAULT 1,
  serial_number TEXT,
  barcode TEXT,
  destination TEXT,
  notes_out TEXT,
  notes_in TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'checked_out' CHECK (status IN ('checked_out', 'in_transit', 'on_site', 'checked_in', 'lost', 'damaged_return')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE asset_checkouts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_checkouts_org ON asset_checkouts(organization_id);
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_asset ON asset_checkouts(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_event ON asset_checkouts(event_id);
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_rental ON asset_checkouts(rental_order_id);
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_status ON asset_checkouts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_asset_checkouts_barcode ON asset_checkouts(barcode);
