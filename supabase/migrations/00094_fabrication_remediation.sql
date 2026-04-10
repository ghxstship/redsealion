-- Migration: Fabrication Remediation

-- 1. Fabrication Files (Blueprints, Proofs, Photos)
CREATE TABLE IF NOT EXISTS fabrication_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabrication_order_id UUID NOT NULL REFERENCES fabrication_orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  version INT DEFAULT 1,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Quality Checklists
CREATE TABLE IF NOT EXISTS quality_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Quality Checks
CREATE TABLE IF NOT EXISTS quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabrication_order_id UUID NOT NULL REFERENCES fabrication_orders(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES quality_checklists(id) ON DELETE SET NULL,
  check_name TEXT NOT NULL,
  is_passed BOOLEAN DEFAULT false,
  notes TEXT,
  checked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Alterations to existing tables
ALTER TABLE bill_of_materials
ADD COLUMN IF NOT EXISTS purchase_requisition_id UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;

ALTER TABLE fabrication_orders
ADD COLUMN IF NOT EXISTS estimated_labor_cents INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_labor_cents INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_cost_cents INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_equipment_id UUID;

ALTER TABLE shop_floor_logs
ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- RLS policies for new tables
ALTER TABLE fabrication_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_checks ENABLE ROW LEVEL SECURITY;

-- Creating indexes
CREATE INDEX IF NOT EXISTS idx_fabrication_files_order ON fabrication_files(fabrication_order_id);
CREATE INDEX IF NOT EXISTS idx_quality_checks_order ON quality_checks(fabrication_order_id);
