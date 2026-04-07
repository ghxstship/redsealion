-- ═══════════════════════════════════════════════════════════
-- Production Advancing Module — Migration 6: Core Advances Table
-- ═══════════════════════════════════════════════════════════

CREATE TABLE production_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  advance_number VARCHAR(20) NOT NULL,

  -- ═══ MODE ═══
  advance_mode advance_mode NOT NULL DEFAULT 'internal',

  -- ═══ CONTEXT ═══
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  event_name TEXT,
  company_name TEXT,
  venue_name TEXT,
  venue_address JSONB,

  -- ═══ SUBMITTER ═══
  submitted_by UUID REFERENCES users(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- ═══ CLASSIFICATION ═══
  advance_type advance_type NOT NULL DEFAULT 'production',
  priority advance_priority DEFAULT 'medium',
  status advance_status NOT NULL DEFAULT 'draft',

  -- ═══ DATES ═══
  service_start_date DATE,
  service_end_date DATE,
  load_in_date DATE,
  strike_date DATE,
  submission_deadline TIMESTAMPTZ,

  -- ═══ CONTENT ═══
  purpose TEXT,
  special_considerations TEXT,
  notes TEXT,
  internal_notes TEXT,
  submission_instructions TEXT,

  -- ═══ APPROVAL ═══
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  changes_requested_note TEXT,

  -- ═══ FINANCIALS ═══
  subtotal_cents INTEGER DEFAULT 0,
  tax_total_cents INTEGER DEFAULT 0,
  discount_total_cents INTEGER DEFAULT 0,
  total_cents INTEGER DEFAULT 0,
  currency_code VARCHAR(3) DEFAULT 'USD',
  line_item_count INTEGER DEFAULT 0,

  -- ═══ SOURCE ═══
  source TEXT DEFAULT 'web',
  source_reference TEXT,
  idempotency_key VARCHAR(128),

  -- ═══ FULFILLMENT ═══
  fulfillment_type fulfillment_type DEFAULT 'delivery',
  fulfillment_location_id UUID REFERENCES advance_inventory_locations(id),

  -- ═══ COLLECTION MODE SETTINGS ═══
  allowed_advance_types advance_type[] DEFAULT '{}',
  allowed_category_groups UUID[] DEFAULT '{}',
  is_catalog_shared BOOLEAN DEFAULT false,
  allow_ad_hoc_items BOOLEAN DEFAULT true,
  require_approval_per_contributor BOOLEAN DEFAULT true,
  max_submissions INTEGER,
  submission_count INTEGER DEFAULT 0,

  -- ═══ VERSIONING ═══
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,

  UNIQUE(organization_id, advance_number),
  UNIQUE(idempotency_key)
);

CREATE INDEX idx_advances_org_status ON production_advances(organization_id, status);
CREATE INDEX idx_advances_project ON production_advances(project_id);
CREATE INDEX idx_advances_mode ON production_advances(advance_mode, status);
CREATE INDEX idx_advances_deadline ON production_advances(submission_deadline)
  WHERE advance_mode = 'collection' AND submission_deadline IS NOT NULL;

-- Auto-generate advance_number per org per year
CREATE FUNCTION generate_advance_number(org_id UUID) RETURNS TEXT AS $$
DECLARE seq INTEGER; yr TEXT;
BEGIN
  yr := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(split_part(advance_number, '-', 3) AS INTEGER)), 0) + 1
  INTO seq FROM production_advances
  WHERE organization_id = org_id AND advance_number LIKE 'ADV-' || yr || '-%';
  RETURN 'ADV-' || yr || '-' || lpad(seq::TEXT, 4, '0');
END; $$ LANGUAGE plpgsql;
