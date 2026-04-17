-- ============================================================
-- 00152: Closeout Immutability + Project Closeout Gate
--
-- Closes closure tickets C-STATE-02, C-STATE-05, C-AUD-01 from
-- docs/audit/role-lifecycle/05-closure-plan.md.
--
-- Adds:
--   1. fn_enforce_closeout_immutability() — rejects UPDATE/DELETE
--      on rows in 'closeout' lifecycle_state except with an
--      explicit platform override (developer + app.closeout_override_reason).
--   2. fn_project_closeout_eligibility() — returns true iff every
--      project_users row is in archival or closeout state.
--   3. fn_enforce_project_closeout() — BEFORE UPDATE trigger on
--      projects.status that blocks status='closed' until all
--      role lifecycles complete.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Closeout immutability trigger function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_enforce_closeout_immutability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_override_reason text;
  v_is_developer    boolean;
BEGIN
  -- Only guard rows that START in closeout. Transitions into closeout
  -- are allowed (governed by fn_enforce_lifecycle_transition).
  IF TG_OP = 'UPDATE' THEN
    IF OLD.lifecycle_state IS DISTINCT FROM 'closeout'::role_lifecycle_state THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.lifecycle_state IS DISTINCT FROM 'closeout'::role_lifecycle_state THEN
      RETURN OLD;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Platform developer override — requires both the role AND a reason GUC.
  BEGIN
    v_override_reason := current_setting('app.closeout_override_reason', true);
  EXCEPTION WHEN OTHERS THEN
    v_override_reason := NULL;
  END;

  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.status  = 'active'
      AND r.name IN ('platform_superadmin','developer')
  ) INTO v_is_developer;

  IF v_is_developer AND v_override_reason IS NOT NULL AND length(v_override_reason) > 0 THEN
    IF TG_OP = 'UPDATE' THEN RETURN NEW; ELSE RETURN OLD; END IF;
  END IF;

  RAISE EXCEPTION 'closeout_immutable: record is sealed' USING ERRCODE = '22000';
END $$;

COMMENT ON FUNCTION public.fn_enforce_closeout_immutability IS
  'Rejects UPDATE/DELETE on rows in lifecycle_state=closeout. Bypass requires platform role developer/superadmin AND GUC app.closeout_override_reason set to a non-empty value.';

-- Attach to every table carrying lifecycle_state.
DROP TRIGGER IF EXISTS trg_project_users_closeout_immutable ON public.project_users;
CREATE TRIGGER trg_project_users_closeout_immutable
  BEFORE UPDATE OR DELETE ON public.project_users
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_closeout_immutability();

DROP TRIGGER IF EXISTS trg_advance_collaborators_closeout_immutable ON public.advance_collaborators;
CREATE TRIGGER trg_advance_collaborators_closeout_immutable
  BEFORE UPDATE OR DELETE ON public.advance_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_closeout_immutability();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_project_collaborators_closeout_immutable ON public.project_collaborators';
    EXECUTE 'CREATE TRIGGER trg_project_collaborators_closeout_immutable
               BEFORE UPDATE OR DELETE ON public.project_collaborators
               FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_closeout_immutability()';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Project closeout eligibility function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_project_closeout_eligibility(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.project_users
    WHERE project_id = p_project_id
      AND lifecycle_state NOT IN ('archival','closeout')
  );
$$;

COMMENT ON FUNCTION public.fn_project_closeout_eligibility IS
  'Returns true iff every project_users row for the project is in archival or closeout state. Consumed by fn_enforce_project_closeout() and by the executive closeout UI.';


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Projects closeout gate (BEFORE UPDATE on projects.status)
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_has_status_col boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'projects'
      AND column_name  = 'status'
  ) INTO v_has_status_col;

  IF NOT v_has_status_col THEN
    RAISE NOTICE 'projects.status column not present — closeout gate deferred';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.fn_enforce_project_closeout()
    RETURNS trigger
    LANGUAGE plpgsql AS $ENFN$
    BEGIN
      IF (NEW.status IS DISTINCT FROM OLD.status)
         AND lower(COALESCE(NEW.status::text, '')) IN ('closed','complete','completed','archived') THEN
        IF NOT public.fn_project_closeout_eligibility(NEW.id) THEN
          RAISE EXCEPTION 'project_closeout_blocked: role lifecycles incomplete'
            USING ERRCODE = '22000';
        END IF;
      END IF;
      RETURN NEW;
    END $ENFN$;
  $fn$;

  EXECUTE 'DROP TRIGGER IF EXISTS trg_projects_closeout_gate ON public.projects';
  EXECUTE 'CREATE TRIGGER trg_projects_closeout_gate
             BEFORE UPDATE OF status ON public.projects
             FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_project_closeout()';
END $$;


-- ============================================================
-- End of 00152
-- ============================================================
