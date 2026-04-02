-- Sprint 2: CRM Pipeline tables and client enhancements

CREATE TABLE sales_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  stages JSONB NOT NULL DEFAULT '["lead","qualified","proposal_sent","negotiation","verbal_yes","contract_signed"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_pipelines_org ON sales_pipelines(organization_id);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES sales_pipelines(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  stage deal_stage NOT NULL DEFAULT 'lead',
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  lost_reason TEXT,
  won_date DATE,
  lost_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_client ON deals(client_id);

CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);

CREATE TABLE client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_interactions_client ON client_interactions(client_id);

-- Add CRM columns to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- RLS
ALTER TABLE sales_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view pipelines" ON sales_pipelines FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins can manage pipelines" ON sales_pipelines FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Org members can view deals" ON deals FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage deals" ON deals FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "Org members can view deal activities" ON deal_activities FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can create deal activities" ON deal_activities FOR INSERT WITH CHECK (organization_id = auth_user_org_id() AND is_producer_role());

CREATE POLICY "Org members can view interactions" ON client_interactions FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage interactions" ON client_interactions FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

-- Triggers
CREATE TRIGGER update_sales_pipelines_updated_at BEFORE UPDATE ON sales_pipelines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
