-- Shipments table (SSOT for all goods movement — inbound receiving + outbound shipping)
-- References existing entities via FKs, maintaining 3NF
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shipment_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'packed', 'shipped', 'in_transit', 'delivered', 'received', 'cancelled')),
  -- Source/destination context (polymorphic via nullable FKs — 3NF compliant)
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rental_order_id UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  -- Logistics
  carrier TEXT,
  tracking_number TEXT,
  origin_address TEXT,
  destination_address TEXT,
  ship_date DATE,
  estimated_arrival DATE,
  actual_arrival DATE,
  weight_lbs DECIMAL,
  num_pieces INT DEFAULT 1,
  shipping_cost_cents INT DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipment_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  equipment_id UUID,
  serial_number TEXT,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'damaged')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_line_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shipments_org ON shipments(organization_id);
CREATE INDEX IF NOT EXISTS idx_shipments_direction ON shipments(organization_id, direction);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_shipment ON shipment_line_items(shipment_id);
