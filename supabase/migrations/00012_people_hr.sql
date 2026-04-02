ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'full_time';
ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_cost NUMERIC(10,2);

CREATE TABLE time_off_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  days_per_year NUMERIC(5,1) NOT NULL DEFAULT 0,
  carry_over_max NUMERIC(5,1) NOT NULL DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE time_off_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES time_off_policies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  entitled_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  carried_over NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES time_off_policies(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested NUMERIC(5,1) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE holiday_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE org_chart_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  department TEXT,
  reports_to UUID REFERENCES org_chart_positions(id) ON DELETE SET NULL,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE time_off_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_chart_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view time off policies" ON time_off_policies FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage time off policies" ON time_off_policies FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Users view own balances" ON time_off_balances FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));
CREATE POLICY "Users view own requests" ON time_off_requests FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));
CREATE POLICY "Users manage own requests" ON time_off_requests FOR ALL USING (organization_id = auth_user_org_id() AND user_id = auth.uid());
CREATE POLICY "Org view holidays" ON holiday_calendars FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage holidays" ON holiday_calendars FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Org view org chart" ON org_chart_positions FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage org chart" ON org_chart_positions FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE TRIGGER update_time_off_policies_updated_at BEFORE UPDATE ON time_off_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_time_off_balances_updated_at BEFORE UPDATE ON time_off_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_org_chart_positions_updated_at BEFORE UPDATE ON org_chart_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
