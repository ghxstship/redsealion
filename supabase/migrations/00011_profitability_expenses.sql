CREATE TABLE project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  po_number TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  description TEXT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE revenue_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  recognized_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  deferred_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'percentage_of_completion',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_recognition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view costs" ON project_costs FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage costs" ON project_costs FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Users view own expenses" ON expenses FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));
CREATE POLICY "Users manage own expenses" ON expenses FOR ALL USING (organization_id = auth_user_org_id() AND user_id = auth.uid());
CREATE POLICY "Org view POs" ON purchase_orders FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage POs" ON purchase_orders FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Org view revenue recognition" ON revenue_recognition FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage revenue recognition" ON revenue_recognition FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE TRIGGER update_project_costs_updated_at BEFORE UPDATE ON project_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_revenue_recognition_updated_at BEFORE UPDATE ON revenue_recognition FOR EACH ROW EXECUTE FUNCTION update_updated_at();
