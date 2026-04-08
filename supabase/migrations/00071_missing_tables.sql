-- Migration 00071: Create 11 missing tables referenced by application code.
-- These tables are queried by existing API routes and server components but
-- were never defined in any prior migration, causing silent failures.

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. favorites — user-scoped entity bookmarks
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select" ON public.favorites FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_entity ON public.favorites(entity_type, entity_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. goals — OKRs and objectives
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'on_track',
  progress integer NOT NULL DEFAULT 0,
  due_date date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON public.goals FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "goals_insert" ON public.goals FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "goals_update" ON public.goals FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "goals_delete" ON public.goals FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX idx_goals_org ON public.goals(organization_id);

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 2b. goal_key_results — measurable key results under goals
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goal_key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  target numeric NOT NULL DEFAULT 0,
  current numeric NOT NULL DEFAULT 0,
  unit text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_key_results_select" ON public.goal_key_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_key_results_insert" ON public.goal_key_results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_key_results_update" ON public.goal_key_results FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_key_results_delete" ON public.goal_key_results FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));

CREATE INDEX idx_goal_key_results_goal ON public.goal_key_results(goal_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. facilities — physical locations for an organization
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'warehouse',
  address jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facilities_select" ON public.facilities FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "facilities_insert" ON public.facilities FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "facilities_update" ON public.facilities FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "facilities_delete" ON public.facilities FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX idx_facilities_org ON public.facilities(organization_id);

CREATE TRIGGER set_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. task_templates — reusable task definitions
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  items jsonb NOT NULL DEFAULT '[]',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_templates_select" ON public.task_templates FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "task_templates_insert" ON public.task_templates FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "task_templates_update" ON public.task_templates FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "task_templates_delete" ON public.task_templates FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX idx_task_templates_org ON public.task_templates(organization_id);

CREATE TRIGGER set_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. task_checklist_items — lightweight sub-items within a task
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS via parent task's org — tasks table already has org_id scoping
CREATE POLICY "task_checklist_items_select" ON public.task_checklist_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_checklist_items_insert" ON public.task_checklist_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_checklist_items_update" ON public.task_checklist_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_checklist_items_delete" ON public.task_checklist_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));

CREATE INDEX idx_task_checklist_items_task ON public.task_checklist_items(task_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. task_attachments — file references attached to tasks
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_attachments_select" ON public.task_attachments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_attachments_insert" ON public.task_attachments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_attachments_delete" ON public.task_attachments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));

CREATE INDEX idx_task_attachments_task ON public.task_attachments(task_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. task_watchers — users following a task for notifications
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_watchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);

ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_watchers_select" ON public.task_watchers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_watchers_insert" ON public.task_watchers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.organization_id = auth_user_org_id()));
CREATE POLICY "task_watchers_delete" ON public.task_watchers FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_task_watchers_task ON public.task_watchers(task_id);
CREATE INDEX idx_task_watchers_user ON public.task_watchers(user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. saved_filters — user-scoped filter presets
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL DEFAULT 'tasks',
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_filters_select" ON public.saved_filters FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "saved_filters_insert" ON public.saved_filters FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_filters_delete" ON public.saved_filters FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_saved_filters_user ON public.saved_filters(user_id);
CREATE INDEX idx_saved_filters_entity ON public.saved_filters(user_id, entity_type);

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. packing_list_items — line items for logistics packing lists
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packing_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Uncategorized',
  quantity integer NOT NULL DEFAULT 1,
  packed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packing_list_items_select" ON public.packing_list_items FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "packing_list_items_insert" ON public.packing_list_items FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "packing_list_items_update" ON public.packing_list_items FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "packing_list_items_delete" ON public.packing_list_items FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX idx_packing_list_items_org ON public.packing_list_items(organization_id);
CREATE INDEX idx_packing_list_items_proposal ON public.packing_list_items(proposal_id);

CREATE TRIGGER set_packing_list_items_updated_at
  BEFORE UPDATE ON public.packing_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. project_status_updates — timeline entries for project progress
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'on_track',
  summary text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_status_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_status_updates_select" ON public.project_status_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()));
CREATE POLICY "project_status_updates_insert" ON public.project_status_updates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_id AND p.organization_id = auth_user_org_id()));

CREATE INDEX idx_project_status_updates_proposal ON public.project_status_updates(proposal_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. recruitment_positions — open crew positions for hiring
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recruitment_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text NOT NULL DEFAULT 'General',
  status text NOT NULL DEFAULT 'open',
  applicants integer NOT NULL DEFAULT 0,
  description text,
  posted_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recruitment_positions_select" ON public.recruitment_positions FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "recruitment_positions_insert" ON public.recruitment_positions FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "recruitment_positions_update" ON public.recruitment_positions FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "recruitment_positions_delete" ON public.recruitment_positions FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX idx_recruitment_positions_org ON public.recruitment_positions(organization_id);

CREATE TRIGGER set_recruitment_positions_updated_at
  BEFORE UPDATE ON public.recruitment_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
