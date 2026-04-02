CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  estimated_hours NUMERIC(6,1),
  actual_hours NUMERIC(6,1),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);

CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'finish_to_start',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_custom_field_values_unique ON custom_field_values(field_definition_id, entity_id);

CREATE TABLE proposal_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  adjustments JSONB NOT NULL DEFAULT '{}',
  total_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_baseline BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org view tasks" ON tasks FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Org manage tasks" ON tasks FOR ALL USING (organization_id = auth_user_org_id());
CREATE POLICY "Task deps viewable" ON task_dependencies FOR SELECT USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "Task deps manageable" ON task_dependencies FOR ALL USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "Task comments viewable" ON task_comments FOR SELECT USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "Task comments manageable" ON task_comments FOR ALL USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "Org view custom fields" ON custom_field_definitions FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Admins manage custom fields" ON custom_field_definitions FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());
CREATE POLICY "Org view custom values" ON custom_field_values FOR SELECT USING (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = field_definition_id AND cfd.organization_id = auth_user_org_id()));
CREATE POLICY "Org manage custom values" ON custom_field_values FOR ALL USING (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = field_definition_id AND cfd.organization_id = auth_user_org_id()));
CREATE POLICY "Org view scenarios" ON proposal_scenarios FOR SELECT USING (organization_id = auth_user_org_id());
CREATE POLICY "Org manage scenarios" ON proposal_scenarios FOR ALL USING (organization_id = auth_user_org_id());

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_field_definitions_updated_at BEFORE UPDATE ON custom_field_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_field_values_updated_at BEFORE UPDATE ON custom_field_values FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_proposal_scenarios_updated_at BEFORE UPDATE ON proposal_scenarios FOR EACH ROW EXECUTE FUNCTION update_updated_at();
