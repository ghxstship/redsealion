-- Sprint 8: Advanced invoicing and custom reports

CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  credit_number TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  reason TEXT,
  issued_date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recurring_invoice_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  next_issue_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  query_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  visualization_type TEXT NOT NULL DEFAULT 'table',
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_notes_org ON credit_notes(organization_id);
CREATE INDEX idx_change_orders_org ON change_orders(organization_id);
CREATE INDEX idx_recurring_schedules_org ON recurring_invoice_schedules(organization_id);
CREATE INDEX idx_custom_reports_org ON custom_reports(organization_id);

ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view credit notes" ON credit_notes FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins can manage credit notes" ON credit_notes FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Org members can view change orders" ON change_orders FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage change orders" ON change_orders FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());
CREATE POLICY "Org members can view schedules" ON recurring_invoice_schedules FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins can manage schedules" ON recurring_invoice_schedules FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Org members can view custom reports" ON custom_reports FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Producers can manage custom reports" ON custom_reports FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role());

CREATE TRIGGER update_change_orders_updated_at BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_recurring_schedules_updated_at BEFORE UPDATE ON recurring_invoice_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
