-- ============================================================
-- 00151: Project Role Events — audit log for role lifecycle
--
-- Closes closure ticket C-STATE-04 from
-- docs/audit/role-lifecycle/05-closure-plan.md.
--
-- Adds:
--   1. project_role_events — append-only audit table
--   2. fn_log_role_transition() — AFTER UPDATE trigger that
--      records every lifecycle_state change
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_role_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  role        project_role NOT NULL,
  from_state  role_lifecycle_state,
  to_state    role_lifecycle_state NOT NULL,
  actor_id    uuid,
  actor_role  text,
  reason      text,
  source      text NOT NULL DEFAULT 'db_trigger',
  at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.project_role_events IS
  'Append-only audit trail for role lifecycle_state transitions. Written by fn_log_role_transition() AFTER UPDATE trigger on every table with lifecycle_state.';

CREATE INDEX IF NOT EXISTS idx_project_role_events_project_at
  ON public.project_role_events(project_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_project_role_events_user_at
  ON public.project_role_events(user_id, at DESC);

ALTER TABLE public.project_role_events ENABLE ROW LEVEL SECURITY;

-- Read: any project member can read events for that project.
CREATE POLICY events_read ON public.project_role_events
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM public.project_users
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

-- No direct writes — events flow exclusively through the trigger.
-- Deny-by-default: no INSERT/UPDATE/DELETE policies means no direct writes.

CREATE OR REPLACE FUNCTION public.fn_log_role_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor_role text;
BEGIN
  IF OLD.lifecycle_state IS NOT DISTINCT FROM NEW.lifecycle_state THEN
    RETURN NEW;
  END IF;

  SELECT role::text INTO v_actor_role
    FROM public.project_users
   WHERE user_id = auth.uid()
     AND project_id = NEW.project_id
   LIMIT 1;

  INSERT INTO public.project_role_events (
    project_id, user_id, role,
    from_state, to_state,
    actor_id, actor_role,
    source
  )
  VALUES (
    NEW.project_id, NEW.user_id, NEW.role,
    OLD.lifecycle_state, NEW.lifecycle_state,
    auth.uid(), COALESCE(v_actor_role, 'platform'),
    TG_TABLE_NAME
  );

  RETURN NEW;
END $$;

COMMENT ON FUNCTION public.fn_log_role_transition IS
  'AFTER UPDATE trigger writing a project_role_events row on every lifecycle_state change. Runs after fn_enforce_lifecycle_transition (00150) accepts the transition.';

-- Attach AFTER UPDATE trigger to canonical + denormalized tables.
DROP TRIGGER IF EXISTS trg_project_users_log_transition ON public.project_users;
CREATE TRIGGER trg_project_users_log_transition
  AFTER UPDATE OF lifecycle_state ON public.project_users
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_role_transition();

DROP TRIGGER IF EXISTS trg_advance_collaborators_log_transition ON public.advance_collaborators;
CREATE TRIGGER trg_advance_collaborators_log_transition
  AFTER UPDATE OF lifecycle_state ON public.advance_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_role_transition();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_project_collaborators_log_transition ON public.project_collaborators';
    EXECUTE 'CREATE TRIGGER trg_project_collaborators_log_transition
               AFTER UPDATE OF lifecycle_state ON public.project_collaborators
               FOR EACH ROW EXECUTE FUNCTION public.fn_log_role_transition()';
  END IF;
END $$;


-- ============================================================
-- End of 00151
-- ============================================================
