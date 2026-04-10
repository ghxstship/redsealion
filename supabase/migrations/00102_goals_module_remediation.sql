-- Migration 00102: Goals Module Remediation
-- Resolves operational gaps: Ownership, Check-ins, Soft-deletes, Task linking, Baselines, Dates, Categories.

-- 1. Alter public.goals
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Company',
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Alter public.goal_key_results
ALTER TABLE public.goal_key_results
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS start_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Create public.goal_task_links
CREATE TABLE IF NOT EXISTS public.goal_task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, task_id)
);

ALTER TABLE public.goal_task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_task_links_select" ON public.goal_task_links FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_task_links_insert" ON public.goal_task_links FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_task_links_delete" ON public.goal_task_links FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));

CREATE INDEX IF NOT EXISTS idx_goal_task_links_goal_id ON public.goal_task_links(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_task_links_task_id ON public.goal_task_links(task_id);

-- 4. Create public.goal_check_ins
CREATE TABLE IF NOT EXISTS public.goal_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_progress integer NOT NULL DEFAULT 0,
  new_progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'on_track',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_check_ins_select" ON public.goal_check_ins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));
CREATE POLICY "goal_check_ins_insert" ON public.goal_check_ins FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id()));

CREATE INDEX IF NOT EXISTS idx_goal_check_ins_goal_id ON public.goal_check_ins(goal_id);

-- 5. Soft-Delete RLS adjustments
-- We drop existing select policies to add the deleted_at IS NULL condition.
-- Since the current schema applied policies with these exact names, we replace them.

DROP POLICY IF EXISTS "goals_select" ON public.goals;
CREATE POLICY "goals_select" ON public.goals FOR SELECT
  USING (organization_id = auth_user_org_id() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "goal_key_results_select" ON public.goal_key_results;
CREATE POLICY "goal_key_results_select" ON public.goal_key_results FOR SELECT
  USING (
    deleted_at IS NULL AND 
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND g.organization_id = auth_user_org_id())
  );
