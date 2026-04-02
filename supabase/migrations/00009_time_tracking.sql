CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  billable BOOLEAN NOT NULL DEFAULT true,
  hourly_rate NUMERIC(10,2),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_entries_org ON time_entries(organization_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);

CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_timesheets_org ON timesheets(organization_id);
CREATE UNIQUE INDEX idx_timesheets_user_week ON timesheets(user_id, week_start);

CREATE TABLE time_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_hours_per_day NUMERIC(4,1) NOT NULL DEFAULT 8,
  max_hours_per_week NUMERIC(5,1) NOT NULL DEFAULT 40,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  overtime_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));
CREATE POLICY "Users can manage own time entries" ON time_entries FOR ALL USING (organization_id = auth_user_org_id() AND user_id = auth.uid());
CREATE POLICY "Users can view own timesheets" ON timesheets FOR SELECT USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));
CREATE POLICY "Users can manage own timesheets" ON timesheets FOR ALL USING (organization_id = auth_user_org_id() AND user_id = auth.uid());
CREATE POLICY "Admins can manage policies" ON time_policies FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_time_policies_updated_at BEFORE UPDATE ON time_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
