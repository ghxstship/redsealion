-- Production Schedules (Build & Strike, Run of Show)
CREATE TABLE IF NOT EXISTS production_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL DEFAULT 'general' CHECK (schedule_type IN ('build_strike', 'run_of_show', 'rehearsal', 'general')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'live', 'completed')),
  timezone TEXT DEFAULT 'America/New_York',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES production_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT NOT NULL DEFAULT 'custom' CHECK (block_type IN ('load_in', 'build', 'rehearsal', 'show', 'transition', 'break', 'strike', 'load_out', 'custom')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INT,
  sort_order INT NOT NULL DEFAULT 0,
  assigned_crew JSONB DEFAULT '[]',
  assigned_departments JSONB DEFAULT '[]',
  location TEXT,
  notes TEXT,
  color TEXT,
  is_global_element BOOLEAN DEFAULT false,
  parent_block_id UUID REFERENCES schedule_blocks(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES production_schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fabrication / Manufacturing Orders
CREATE TABLE IF NOT EXISTS fabrication_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  name TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'fabrication' CHECK (order_type IN ('fabrication', 'print', 'manufacturing', 'custom')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'in_production', 'quality_check', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_cost_cents INT DEFAULT 0,
  total_cost_cents INT DEFAULT 0,
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabrication_order_id UUID NOT NULL REFERENCES fabrication_orders(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  sku TEXT,
  quantity_required DECIMAL NOT NULL DEFAULT 1,
  quantity_on_hand DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'each',
  unit_cost_cents INT DEFAULT 0,
  supplier TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'allocated')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_floor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabrication_order_id UUID NOT NULL REFERENCES fabrication_orders(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('started', 'paused', 'resumed', 'completed', 'quality_pass', 'quality_fail', 'note')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Requisitions
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requisition_number TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'ordered')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  needed_by DATE,
  notes TEXT,
  total_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requisition_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_cost_cents INT DEFAULT 0,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  received_by UUID REFERENCES users(id),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT DEFAULT 'partial' CHECK (status IN ('partial', 'complete', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rental Orders
CREATE TABLE IF NOT EXISTS rental_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reserved', 'checked_out', 'on_site', 'returned', 'invoiced', 'cancelled')),
  rental_start DATE NOT NULL,
  rental_end DATE NOT NULL,
  total_cents INT DEFAULT 0,
  deposit_cents INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_order_id UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
  equipment_id UUID,
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  daily_rate_cents INT DEFAULT 0,
  rental_days INT DEFAULT 1,
  line_total_cents INT DEFAULT 0,
  status TEXT DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_out', 'returned', 'damaged', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sub_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  rental_order_id UUID REFERENCES rental_orders(id) ON DELETE SET NULL,
  po_number TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'received', 'returned', 'invoiced')),
  rental_start DATE NOT NULL,
  rental_end DATE NOT NULL,
  total_cost_cents INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabrication_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_floor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisition_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_rentals ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_schedules_org ON production_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_event ON production_schedules(event_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_schedule ON schedule_blocks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_fabrication_orders_org ON fabrication_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_fabrication_orders_status ON fabrication_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_bom_order ON bill_of_materials(fabrication_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_org ON purchase_requisitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_org ON rental_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_rental_orders_status ON rental_orders(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sub_rentals_org ON sub_rentals(organization_id);
