-- XPB Initial Schema Migration
-- Multi-tenant experiential proposal builder

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE org_role AS ENUM ('super_admin', 'org_admin', 'project_manager', 'designer', 'fabricator', 'installer', 'client_primary', 'client_viewer');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'negotiating', 'approved', 'in_production', 'active', 'complete', 'cancelled');
CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'pending_approval', 'approved', 'complete', 'skipped');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'complete');
CREATE TYPE requirement_status AS ENUM ('pending', 'in_progress', 'complete', 'waived');
CREATE TYPE requirement_assignee AS ENUM ('client', 'producer', 'both', 'external_vendor');
CREATE TYPE terms_document_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE invoice_type AS ENUM ('deposit', 'balance', 'change_order', 'addon', 'final', 'recurring');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void');
CREATE TYPE asset_status AS ENUM ('planned', 'in_production', 'in_transit', 'deployed', 'in_storage', 'retired', 'disposed');
CREATE TYPE asset_condition AS ENUM ('new', 'excellent', 'good', 'fair', 'poor', 'damaged');
CREATE TYPE actor_type AS ENUM ('admin', 'client', 'system');
CREATE TYPE contact_role AS ENUM ('primary', 'billing', 'creative', 'operations');
CREATE TYPE creative_reference_type AS ENUM ('reference', 'mood', 'palette', 'experience', 'campaign', 'material', 'competitor', 'inspiration');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  brand_config JSONB NOT NULL DEFAULT '{
    "primaryColor": "#1A1A1A",
    "secondaryColor": "#555555",
    "accentColor": "#1A1A1A",
    "backgroundColor": "#FFFFFF",
    "fontHeading": "Inter",
    "fontBody": "Inter"
  }'::jsonb,
  facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_payment_terms JSONB NOT NULL DEFAULT '{
    "structure": "50/50",
    "depositPercent": 50,
    "balancePercent": 50,
    "lateFeeRate": 1.5,
    "creditCardSurcharge": 3
  }'::jsonb,
  default_phase_template_id UUID,
  settings JSONB NOT NULL DEFAULT '{
    "timezone": "America/New_York",
    "currency": "USD",
    "invoicePrefix": "INV",
    "proposalPrefix": "XPB"
  }'::jsonb,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================
-- PHASE TEMPLATES
-- ============================================================
CREATE TABLE phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phase_templates_org ON phase_templates(organization_id);

-- Add FK from organizations to phase_templates (deferred because of circular reference)
ALTER TABLE organizations
  ADD CONSTRAINT fk_org_default_template
  FOREIGN KEY (default_phase_template_id)
  REFERENCES phase_templates(id)
  ON DELETE SET NULL;

-- ============================================================
-- TERMS DOCUMENTS
-- ============================================================
CREATE TABLE terms_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  status terms_document_status NOT NULL DEFAULT 'draft',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_terms_docs_org ON terms_documents(organization_id);

-- ============================================================
-- PORTFOLIO LIBRARY
-- ============================================================
CREATE TABLE portfolio_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_year INT,
  client_name TEXT,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_org ON portfolio_library(organization_id);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY, -- matches auth.users.id
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'designer',
  title TEXT,
  phone TEXT,
  rate_card TEXT,
  facility_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  billing_address JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  _crm_external_ids JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_org ON clients(organization_id);

-- ============================================================
-- CLIENT CONTACTS
-- ============================================================
CREATE TABLE client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role contact_role NOT NULL DEFAULT 'primary',
  is_decision_maker BOOLEAN NOT NULL DEFAULT false,
  is_signatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);

-- ============================================================
-- PROPOSALS
-- ============================================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtitle TEXT,
  version INT NOT NULL DEFAULT 1,
  status proposal_status NOT NULL DEFAULT 'draft',
  current_phase_id UUID, -- FK added below after phases table
  probability INT,
  currency TEXT NOT NULL DEFAULT 'USD',
  total_value NUMERIC NOT NULL DEFAULT 0,
  total_with_addons NUMERIC NOT NULL DEFAULT 0,
  prepared_date DATE,
  valid_until DATE,
  source TEXT,
  narrative_context JSONB,
  payment_terms JSONB,
  terms_document_id UUID REFERENCES terms_documents(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  portal_access_token TEXT UNIQUE,
  portal_first_viewed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  parent_proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  phase_template_id UUID REFERENCES phase_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_org ON proposals(organization_id);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_token ON proposals(portal_access_token);

-- ============================================================
-- VENUES
-- ============================================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  type TEXT NOT NULL DEFAULT 'venue',
  activation_dates JSONB,
  load_in JSONB,
  strike JSONB,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_on_site JSONB,
  sequence INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_venues_proposal ON venues(proposal_id);

-- ============================================================
-- PHASES
-- ============================================================
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  status phase_status NOT NULL DEFAULT 'not_started',
  terms_sections TEXT[] NOT NULL DEFAULT '{}',
  narrative TEXT,
  phase_investment NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phases_proposal ON phases(proposal_id);

-- Now add FK from proposals to phases
ALTER TABLE proposals
  ADD CONSTRAINT fk_proposals_current_phase
  FOREIGN KEY (current_phase_id)
  REFERENCES phases(id)
  ON DELETE SET NULL;

-- ============================================================
-- PHASE DELIVERABLES
-- ============================================================
CREATE TABLE phase_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  details TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'service',
  unit TEXT NOT NULL DEFAULT 'lot',
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT true,
  terms_sections TEXT[],
  pm_metadata JSONB,
  asset_metadata JSONB,
  resource_metadata JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deliverables_phase ON phase_deliverables(phase_id);

-- ============================================================
-- PHASE ADD-ONS
-- ============================================================
CREATE TABLE phase_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'service',
  unit TEXT NOT NULL DEFAULT 'lot',
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT true,
  selected BOOLEAN NOT NULL DEFAULT false,
  terms_sections TEXT[],
  mutually_exclusive_group TEXT,
  pm_metadata JSONB,
  asset_metadata JSONB,
  resource_metadata JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addons_phase ON phase_addons(phase_id);

-- ============================================================
-- MILESTONE GATES
-- ============================================================
CREATE TABLE milestone_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unlocks_description TEXT,
  status milestone_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestones_phase ON milestone_gates(phase_id);

-- ============================================================
-- MILESTONE REQUIREMENTS
-- ============================================================
CREATE TABLE milestone_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestone_gates(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status requirement_status NOT NULL DEFAULT 'pending',
  assignee requirement_assignee NOT NULL DEFAULT 'producer',
  due_offset TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  finance_trigger JSONB,
  evidence_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requirements_milestone ON milestone_requirements(milestone_id);

-- ============================================================
-- CREATIVE REFERENCES
-- ============================================================
CREATE TABLE creative_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  type creative_reference_type NOT NULL DEFAULT 'reference',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refs_phase ON creative_references(phase_id);

-- ============================================================
-- PHASE PORTFOLIO LINKS
-- ============================================================
CREATE TABLE phase_portfolio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  portfolio_item_id UUID NOT NULL REFERENCES portfolio_library(id) ON DELETE CASCADE,
  context_description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_links_phase ON phase_portfolio_links(phase_id);

-- ============================================================
-- TEAM ASSIGNMENTS
-- ============================================================
CREATE TABLE team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facility_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_proposal ON team_assignments(proposal_id);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  type invoice_type NOT NULL DEFAULT 'deposit',
  status invoice_status NOT NULL DEFAULT 'draft',
  triggered_by_milestone_id UUID REFERENCES milestone_gates(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  paid_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  memo TEXT,
  payment_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_proposal ON invoices(proposal_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);

-- ============================================================
-- INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT true,
  phase_number TEXT,
  category TEXT,
  deliverable_id UUID REFERENCES phase_deliverables(id) ON DELETE SET NULL,
  addon_id UUID REFERENCES phase_addons(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_deliverable_id UUID REFERENCES phase_deliverables(id) ON DELETE SET NULL,
  source_addon_id UUID REFERENCES phase_addons(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  trackable BOOLEAN NOT NULL DEFAULT true,
  reusable BOOLEAN NOT NULL DEFAULT false,
  dimensions TEXT,
  weight TEXT,
  material TEXT,
  storage_requirements TEXT,
  acquisition_cost NUMERIC,
  current_value NUMERIC,
  depreciation_method TEXT,
  useful_life_months INT,
  status asset_status NOT NULL DEFAULT 'planned',
  condition asset_condition NOT NULL DEFAULT 'new',
  deployment_count INT NOT NULL DEFAULT 0,
  max_deployments INT,
  current_location JSONB,
  return_required BOOLEAN NOT NULL DEFAULT false,
  barcode TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_proposal ON assets(proposal_id);
CREATE INDEX idx_assets_org ON assets(organization_id);

-- ============================================================
-- ASSET LOCATION HISTORY
-- ============================================================
CREATE TABLE asset_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  location JSONB NOT NULL,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  condition_at_move TEXT,
  notes TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_history_asset ON asset_location_history(asset_id);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_type actor_type NOT NULL DEFAULT 'admin',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_proposal ON activity_log(proposal_id);
CREATE INDEX idx_activity_org ON activity_log(organization_id);

-- ============================================================
-- PROPOSAL COMMENTS
-- ============================================================
CREATE TABLE proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES phase_deliverables(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES phase_addons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_proposal ON proposal_comments(proposal_id);

-- ============================================================
-- FILE ATTACHMENTS
-- ============================================================
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  is_client_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_proposal ON file_attachments(proposal_id);

-- ============================================================
-- EXPORT CONFIGURATIONS
-- ============================================================
CREATE TABLE export_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exports_org ON export_configurations(organization_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
    AND table_name != 'activity_log'
    AND table_name != 'asset_location_history'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_portfolio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_configurations ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's org_id
CREATE OR REPLACE FUNCTION auth_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS org_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin-level for their org
CREATE OR REPLACE FUNCTION is_org_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'org_admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is a producer role (not client)
CREATE OR REPLACE FUNCTION is_producer_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'org_admin', 'project_manager', 'designer', 'fabricator', 'installer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES: organizations
-- ============================================================
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (is_super_admin() OR id = auth_user_org_id());

CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (is_super_admin() OR true); -- Allow during signup

CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (is_super_admin() OR (id = auth_user_org_id() AND is_org_admin_or_above()));

-- ============================================================
-- RLS POLICIES: users
-- ============================================================
CREATE POLICY "users_select" ON users FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "users_update" ON users FOR UPDATE
  USING (is_super_admin() OR (organization_id = auth_user_org_id() AND (is_org_admin_or_above() OR id = auth.uid())));

-- ============================================================
-- RLS POLICIES: phase_templates
-- ============================================================
CREATE POLICY "templates_select" ON phase_templates FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "templates_insert" ON phase_templates FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "templates_update" ON phase_templates FOR UPDATE
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "templates_delete" ON phase_templates FOR DELETE
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- ============================================================
-- RLS POLICIES: terms_documents
-- ============================================================
CREATE POLICY "terms_select" ON terms_documents FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "terms_modify" ON terms_documents FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- ============================================================
-- RLS POLICIES: clients
-- ============================================================
CREATE POLICY "clients_select" ON clients FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "clients_modify" ON clients FOR ALL
  USING (organization_id = auth_user_org_id() AND is_producer_role());

-- ============================================================
-- RLS POLICIES: client_contacts
-- ============================================================
CREATE POLICY "contacts_select" ON client_contacts FOR SELECT
  USING (
    is_super_admin()
    OR EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_contacts.client_id
      AND c.organization_id = auth_user_org_id()
    )
  );

CREATE POLICY "contacts_modify" ON client_contacts FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM clients c
      WHERE c.id = client_contacts.client_id
      AND c.organization_id = auth_user_org_id()
    )
    AND is_producer_role()
  );

-- ============================================================
-- RLS POLICIES: proposals
-- ============================================================
CREATE POLICY "proposals_select" ON proposals FOR SELECT
  USING (
    is_super_admin()
    OR (organization_id = auth_user_org_id() AND is_producer_role())
    OR (
      -- Client can see their own proposals (non-draft)
      organization_id = auth_user_org_id()
      AND status != 'draft'
      AND EXISTS(
        SELECT 1 FROM client_contacts cc
        JOIN clients cl ON cl.id = cc.client_id
        WHERE cc.user_id = auth.uid()
        AND cl.id = proposals.client_id
      )
    )
  );

CREATE POLICY "proposals_insert" ON proposals FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "proposals_update" ON proposals FOR UPDATE
  USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "proposals_delete" ON proposals FOR DELETE
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- ============================================================
-- RLS POLICIES: phases (inherit from proposal)
-- ============================================================
CREATE POLICY "phases_select" ON phases FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = phases.proposal_id
      AND (
        is_super_admin()
        OR (p.organization_id = auth_user_org_id() AND is_producer_role())
        OR (
          p.organization_id = auth_user_org_id()
          AND p.status != 'draft'
          AND EXISTS(
            SELECT 1 FROM client_contacts cc
            JOIN clients cl ON cl.id = cc.client_id
            WHERE cc.user_id = auth.uid() AND cl.id = p.client_id
          )
        )
      )
    )
  );

CREATE POLICY "phases_modify" ON phases FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = phases.proposal_id
      AND p.organization_id = auth_user_org_id()
      AND is_producer_role()
    )
  );

-- ============================================================
-- RLS POLICIES: phase_deliverables
-- ============================================================
CREATE POLICY "deliverables_select" ON phase_deliverables FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_deliverables.phase_id
      AND (
        is_super_admin()
        OR (p.organization_id = auth_user_org_id())
      )
    )
  );

CREATE POLICY "deliverables_modify" ON phase_deliverables FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_deliverables.phase_id
      AND p.organization_id = auth_user_org_id()
      AND is_producer_role()
    )
  );

-- ============================================================
-- RLS POLICIES: phase_addons
-- ============================================================
CREATE POLICY "addons_select" ON phase_addons FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_addons.phase_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "addons_modify_producer" ON phase_addons FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_addons.phase_id
      AND p.organization_id = auth_user_org_id()
      AND is_producer_role()
    )
  );

-- Client can toggle selected on addons
CREATE POLICY "addons_client_select_toggle" ON phase_addons FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      JOIN client_contacts cc ON EXISTS(
        SELECT 1 FROM clients cl WHERE cl.id = p.client_id AND cc.client_id = cl.id
      )
      WHERE ph.id = phase_addons.phase_id
      AND cc.user_id = auth.uid()
      AND auth_user_role() = 'client_primary'
    )
  );

-- ============================================================
-- RLS POLICIES: milestone_gates, milestone_requirements
-- ============================================================
CREATE POLICY "milestones_select" ON milestone_gates FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = milestone_gates.phase_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "milestones_modify" ON milestone_gates FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = milestone_gates.phase_id
      AND p.organization_id = auth_user_org_id()
      AND is_producer_role()
    )
  );

CREATE POLICY "requirements_select" ON milestone_requirements FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM milestone_gates mg
      JOIN phases ph ON ph.id = mg.phase_id
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE mg.id = milestone_requirements.milestone_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "requirements_modify_producer" ON milestone_requirements FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM milestone_gates mg
      JOIN phases ph ON ph.id = mg.phase_id
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE mg.id = milestone_requirements.milestone_id
      AND p.organization_id = auth_user_org_id()
      AND is_producer_role()
    )
  );

-- Client can update status on client-assigned requirements
CREATE POLICY "requirements_client_approve" ON milestone_requirements FOR UPDATE
  USING (
    assignee IN ('client', 'both')
    AND auth_user_role() = 'client_primary'
    AND EXISTS(
      SELECT 1 FROM milestone_gates mg
      JOIN phases ph ON ph.id = mg.phase_id
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE mg.id = milestone_requirements.milestone_id
      AND p.organization_id = auth_user_org_id()
    )
  );

-- ============================================================
-- RLS POLICIES: creative_references, portfolio links
-- ============================================================
CREATE POLICY "refs_select" ON creative_references FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM phases ph JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = creative_references.phase_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "refs_modify" ON creative_references FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM phases ph JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = creative_references.phase_id
      AND p.organization_id = auth_user_org_id() AND is_producer_role()
    )
  );

CREATE POLICY "portfolio_links_select" ON phase_portfolio_links FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM phases ph JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_portfolio_links.phase_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "portfolio_links_modify" ON phase_portfolio_links FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM phases ph JOIN proposals p ON p.id = ph.proposal_id
      WHERE ph.id = phase_portfolio_links.phase_id
      AND p.organization_id = auth_user_org_id() AND is_producer_role()
    )
  );

CREATE POLICY "portfolio_select" ON portfolio_library FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "portfolio_modify" ON portfolio_library FOR ALL
  USING (organization_id = auth_user_org_id() AND is_producer_role());

-- ============================================================
-- RLS POLICIES: team_assignments
-- ============================================================
CREATE POLICY "team_select" ON team_assignments FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = team_assignments.proposal_id
      AND (is_super_admin() OR p.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "team_modify" ON team_assignments FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = team_assignments.proposal_id
      AND p.organization_id = auth_user_org_id()
      AND is_org_admin_or_above()
    )
  );

-- ============================================================
-- RLS POLICIES: invoices, invoice_line_items
-- ============================================================
CREATE POLICY "invoices_select" ON invoices FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "invoices_modify" ON invoices FOR ALL
  USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "line_items_select" ON invoice_line_items FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_line_items.invoice_id
      AND (is_super_admin() OR i.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "line_items_modify" ON invoice_line_items FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_line_items.invoice_id
      AND i.organization_id = auth_user_org_id() AND is_producer_role()
    )
  );

-- ============================================================
-- RLS POLICIES: assets, asset_location_history
-- ============================================================
CREATE POLICY "assets_select" ON assets FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "assets_modify" ON assets FOR ALL
  USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "asset_history_select" ON asset_location_history FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM assets a
      WHERE a.id = asset_location_history.asset_id
      AND (is_super_admin() OR a.organization_id = auth_user_org_id())
    )
  );

CREATE POLICY "asset_history_modify" ON asset_location_history FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM assets a
      WHERE a.id = asset_location_history.asset_id
      AND a.organization_id = auth_user_org_id() AND is_producer_role()
    )
  );

-- ============================================================
-- RLS POLICIES: activity_log
-- ============================================================
CREATE POLICY "activity_select" ON activity_log FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "activity_insert" ON activity_log FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());

-- ============================================================
-- RLS POLICIES: proposal_comments
-- ============================================================
CREATE POLICY "comments_select" ON proposal_comments FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_comments.proposal_id
      AND p.organization_id = auth_user_org_id()
      AND (
        is_producer_role()
        OR (NOT proposal_comments.is_internal) -- clients can't see internal comments
      )
    )
  );

CREATE POLICY "comments_insert" ON proposal_comments FOR INSERT
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_comments.proposal_id
      AND p.organization_id = auth_user_org_id()
    )
  );

CREATE POLICY "comments_update" ON proposal_comments FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_comments.proposal_id
      AND p.organization_id = auth_user_org_id()
    )
    AND (author_id = auth.uid() OR is_org_admin_or_above())
  );

-- ============================================================
-- RLS POLICIES: file_attachments
-- ============================================================
CREATE POLICY "files_select" ON file_attachments FOR SELECT
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = file_attachments.proposal_id
      AND p.organization_id = auth_user_org_id()
      AND (is_producer_role() OR file_attachments.is_client_visible)
    )
  );

CREATE POLICY "files_modify" ON file_attachments FOR ALL
  USING (
    EXISTS(
      SELECT 1 FROM proposals p
      WHERE p.id = file_attachments.proposal_id
      AND p.organization_id = auth_user_org_id()
    )
  );

-- ============================================================
-- RLS POLICIES: export_configurations
-- ============================================================
CREATE POLICY "exports_select" ON export_configurations FOR SELECT
  USING (is_super_admin() OR organization_id = auth_user_org_id());

CREATE POLICY "exports_modify" ON export_configurations FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE phases;
ALTER PUBLICATION supabase_realtime ADD TABLE milestone_requirements;
ALTER PUBLICATION supabase_realtime ADD TABLE phase_addons;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
