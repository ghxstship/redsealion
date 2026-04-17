-- ============================================================
-- 00150: Role Stage Transitions + Preconditions + Trigger
--
-- Closes closure tickets C-STATE-01, C-STATE-03, C-STATE-06
-- from docs/audit/role-lifecycle/05-closure-plan.md.
--
-- Adds:
--   1. role_stage_transitions — allow-list of valid {from,to} pairs
--   2. role_stage_preconditions — declarative precondition registry
--   3. fn_enforce_lifecycle_transition() — BEFORE UPDATE trigger
--   4. lifecycle_state column on project_users (canonical) + trigger
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Allowed-transitions registry
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_stage_transitions (
  from_state    role_lifecycle_state NOT NULL,
  to_state      role_lifecycle_state NOT NULL,
  allowed_roles project_role[]       NOT NULL,
  notes         text,
  PRIMARY KEY (from_state, to_state)
);

COMMENT ON TABLE public.role_stage_transitions IS
  'Allow-list of {from_state, to_state} role-lifecycle transitions. Consumed by fn_enforce_lifecycle_transition().';

ALTER TABLE public.role_stage_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transitions_read ON public.role_stage_transitions FOR SELECT USING (true);
CREATE POLICY transitions_write ON public.role_stage_transitions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.status  = 'active'
      AND r.name IN ('platform_superadmin','platform_admin','owner','admin')
  )
);

-- Canonical transitions (linear happy path). Forks and exceptions get their
-- own rows in subsequent migrations as workflow features are built.
INSERT INTO public.role_stage_transitions (from_state, to_state, allowed_roles, notes) VALUES
  ('discovery','qualification',          ARRAY['executive','production','management']::project_role[], 'intake -> vetting'),
  ('qualification','onboarding',         ARRAY['executive','production','management']::project_role[], 'docs complete'),
  ('onboarding','contracting',           ARRAY['executive','production','management']::project_role[], 'contract drafted'),
  ('contracting','scheduling',           ARRAY['production','management']::project_role[],             'contract signed'),
  ('scheduling','advancing',             ARRAY['production','management']::project_role[],             'call time fixed'),
  ('advancing','deployment',             ARRAY['production','management']::project_role[],             'advance approved'),
  ('deployment','active_operations',     ARRAY['production','management','crew','staff']::project_role[], 'checkin recorded'),
  ('active_operations','demobilization', ARRAY['production','management']::project_role[],             'operations closed'),
  ('demobilization','settlement',        ARRAY['executive','production','management']::project_role[], 'strike complete'),
  ('settlement','reconciliation',        ARRAY['executive','management']::project_role[],              'payment cleared'),
  ('reconciliation','archival',          ARRAY['executive','production','management']::project_role[], 'tax/ledger closed'),
  ('archival','closeout',                ARRAY['executive']::project_role[],                           'final lock')
ON CONFLICT (from_state, to_state) DO UPDATE SET
  allowed_roles = EXCLUDED.allowed_roles,
  notes         = EXCLUDED.notes;


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Preconditions registry
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_stage_preconditions (
  role        project_role         NOT NULL,
  stage       role_lifecycle_state NOT NULL,
  check_kind  text                 NOT NULL,
  required    boolean              NOT NULL DEFAULT true,
  notes       text,
  PRIMARY KEY (role, stage, check_kind)
);

COMMENT ON TABLE public.role_stage_preconditions IS
  'Declarative preconditions for role x target-stage transitions. Consumed by fn_check_preconditions() and fn_enforce_lifecycle_transition().';

ALTER TABLE public.role_stage_preconditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY preconditions_read ON public.role_stage_preconditions FOR SELECT USING (true);
CREATE POLICY preconditions_write ON public.role_stage_preconditions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.status  = 'active'
      AND r.name IN ('platform_superadmin','platform_admin','owner','admin')
  )
);

-- Baseline precondition seed per docs/audit/role-lifecycle/03-forks-options-dependencies.md §3.3.
-- Expanded in per-feature migrations as workflow artifacts land (C-DEP-01..11).
INSERT INTO public.role_stage_preconditions (role, stage, check_kind, notes) VALUES
  ('crew',  'onboarding',  'coi_valid',                'COI on file and not expired'),
  ('crew',  'onboarding',  'w9_or_w8_on_file',         'tax form validated'),
  ('crew',  'onboarding',  'id_verified',              'I-9 (US) or equivalent'),
  ('crew',  'scheduling',  'contract_signed',          'deal memo e-signed'),
  ('crew',  'settlement',  'timesheet_approved',       'timesheet closed by management'),
  ('staff', 'onboarding',  'id_verified',              ''),
  ('staff', 'scheduling',  'contract_signed',          ''),
  ('talent','scheduling',  'performance_agreement',    'long-form PA e-signed'),
  ('talent','advancing',   'rider_confirmed',          'hospitality + tech riders confirmed'),
  ('vendor','onboarding',  'coi_valid',                ''),
  ('vendor','onboarding',  'w9_or_w8_on_file',         ''),
  ('vendor','onboarding',  'msa_on_file',              'master service agreement'),
  ('vendor','scheduling',  'po_issued',                'purchase order approved'),
  ('vendor','settlement',  'bol_received',             'bill of lading reconciled'),
  ('vendor','settlement',  'po_match_clean',           '3-way match: PO+invoice+receipt'),
  ('press', 'onboarding',  'outlet_verified',          'editor letter validated'),
  ('press', 'deployment',  'credential_issued',        'press credential active'),
  ('guest', 'deployment',  'ticket_issued',            ''),
  ('attendee','deployment','ticket_scanned',           '')
ON CONFLICT (role, stage, check_kind) DO NOTHING;

CREATE OR REPLACE FUNCTION public.fn_check_preconditions(
  p_role         project_role,
  p_target_state role_lifecycle_state
) RETURNS text[]
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    ARRAY_AGG(check_kind) FILTER (WHERE required = true),
    ARRAY[]::text[]
  )
  FROM public.role_stage_preconditions
  WHERE role  = p_role
    AND stage = p_target_state;
$$;

COMMENT ON FUNCTION public.fn_check_preconditions IS
  'Returns the required preconditions for {role, target_state}. Callers evaluate each check_kind against the relevant domain table and block transition if any fail. Full per-check evaluation fn is layered in per-feature migrations.';


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Transition-enforcement trigger function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_enforce_lifecycle_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  actor_role project_role;
  v_allowed  project_role[];
BEGIN
  IF OLD.lifecycle_state IS NOT DISTINCT FROM NEW.lifecycle_state THEN
    RETURN NEW;
  END IF;

  -- Read the caller's project role on this project (if caller has any).
  -- Platform admins bypass via the closeout-override GUC (see 00152).
  SELECT role INTO actor_role
    FROM public.project_users
   WHERE user_id = auth.uid()
     AND project_id = NEW.project_id
     AND invite_status = 'accepted'
   LIMIT 1;

  SELECT allowed_roles INTO v_allowed
    FROM public.role_stage_transitions
   WHERE from_state = OLD.lifecycle_state
     AND to_state   = NEW.lifecycle_state;

  IF v_allowed IS NULL THEN
    RAISE EXCEPTION
      'invalid_role_lifecycle_transition: no rule from % to %', OLD.lifecycle_state, NEW.lifecycle_state
      USING ERRCODE = '22000';
  END IF;

  IF actor_role IS NULL OR NOT (actor_role = ANY(v_allowed)) THEN
    RAISE EXCEPTION
      'invalid_role_lifecycle_transition: role % cannot move % -> %',
      COALESCE(actor_role::text, 'null'), OLD.lifecycle_state, NEW.lifecycle_state
      USING ERRCODE = '22000';
  END IF;

  RETURN NEW;
END $$;

COMMENT ON FUNCTION public.fn_enforce_lifecycle_transition IS
  'BEFORE UPDATE trigger on tables with lifecycle_state. Rejects transitions not declared in role_stage_transitions or attempted by a project role outside the allowlist.';


-- ─────────────────────────────────────────────────────────────
-- STEP 4: project_users lifecycle_state column (canonical SSOT)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.project_users
  ADD COLUMN IF NOT EXISTS lifecycle_state role_lifecycle_state NOT NULL DEFAULT 'discovery';

CREATE INDEX IF NOT EXISTS idx_project_users_lifecycle
  ON public.project_users(project_id, lifecycle_state);

-- Attach transition-enforcement trigger.
DROP TRIGGER IF EXISTS trg_project_users_lifecycle_transition ON public.project_users;
CREATE TRIGGER trg_project_users_lifecycle_transition
  BEFORE UPDATE OF lifecycle_state ON public.project_users
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_lifecycle_transition();

-- Re-attach the same trigger to the denormalized cache tables from 00148.
DROP TRIGGER IF EXISTS trg_advance_collaborators_lifecycle_transition ON public.advance_collaborators;
CREATE TRIGGER trg_advance_collaborators_lifecycle_transition
  BEFORE UPDATE OF lifecycle_state ON public.advance_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_lifecycle_transition();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_project_collaborators_lifecycle_transition ON public.project_collaborators';
    EXECUTE 'CREATE TRIGGER trg_project_collaborators_lifecycle_transition
               BEFORE UPDATE OF lifecycle_state ON public.project_collaborators
               FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_lifecycle_transition()';
  END IF;
END $$;


-- ============================================================
-- End of 00150
-- ============================================================
