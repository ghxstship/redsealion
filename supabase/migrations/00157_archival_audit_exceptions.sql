-- ============================================================
-- 00157: Archival + Audit + Exceptions
--
-- Closes closure tickets C-DATA-01, C-DATA-03, C-DATA-10,
-- C-AUD-02, C-EX-TBL, C-DATA-02 (stub), C-STATE-02 extension.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Crew / staff recall pool
-- ─────────────────────────────────────────────────────────────

CREATE TYPE recall_eligibility AS ENUM ('eligible','hold','blocked');

CREATE TABLE IF NOT EXISTS public.recall_pool (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_id       uuid REFERENCES public.people(id) ON DELETE SET NULL,
  user_id         uuid,
  specialty       text,
  rating_avg      numeric(3,2),
  ratings_count   integer NOT NULL DEFAULT 0,
  last_project_id uuid,
  last_project_at timestamptz,
  eligibility     recall_eligibility NOT NULL DEFAULT 'eligible',
  blocked_reason  text,
  eligible_from   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recall_pool_user_specialty
  ON public.recall_pool(organization_id, user_id, specialty) WHERE user_id IS NOT NULL;

ALTER TABLE public.recall_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY recall_pool_org_scope ON public.recall_pool
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Role ratings (crew / vendor / talent / staff)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.project_role_ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL,
  subject_type    text NOT NULL CHECK (subject_type IN ('person','vendor','client','sponsor')),
  subject_id      uuid NOT NULL,
  rater_user_id   uuid,
  rater_role      project_role,
  score           numeric(3,2) NOT NULL CHECK (score >= 0 AND score <= 5),
  dimensions      jsonb NOT NULL DEFAULT '{}'::jsonb,
  comment         text,
  visibility      text NOT NULL DEFAULT 'private_to_management'
    CHECK (visibility IN ('public','private_to_management','closed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_role_ratings_subject
  ON public.project_role_ratings(subject_type, subject_id);

ALTER TABLE public.project_role_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_role_ratings_org_scope ON public.project_role_ratings
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Vendor scorecards
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendor_scorecards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vendor_id       uuid NOT NULL,
  project_id      uuid,
  scores          jsonb NOT NULL DEFAULT '{}'::jsonb,
  sla_breaches    integer NOT NULL DEFAULT 0,
  reviewer_id     uuid,
  overall_score   numeric(3,2),
  notes           text,
  snapshot_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_scorecards_org_scope ON public.vendor_scorecards
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Retention policies + scheduled purge
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.retention_policies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_kind     text NOT NULL,
  min_retention_days integer NOT NULL DEFAULT 365,
  legal_hold      boolean NOT NULL DEFAULT false,
  purge_after_days integer,
  active          boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, entity_kind)
);

ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY retention_policies_org_scope ON public.retention_policies
  FOR ALL USING (organization_id IS NULL OR organization_id IN (SELECT user_org_ids()));

-- Seed baseline policies for records typed in this audit (tunable).
INSERT INTO public.retention_policies (organization_id, entity_kind, min_retention_days, purge_after_days, notes) VALUES
  (NULL, 'timesheets',          2555,   NULL, '7 years; payroll audit trail'),
  (NULL, 'tax_exports',          2555,   NULL, '7 years; tax retention'),
  (NULL, 'contracts',            2555,   NULL, '7 years from expiry'),
  (NULL, 'compliance_documents', 2555,   NULL, '7 years; COI / W9 history'),
  (NULL, 'project_role_events',  1825,   NULL, '5 years; audit trail'),
  (NULL, 'zone_access_events',    730,   NULL, '2 years; security log'),
  (NULL, 'checkins',              730,   NULL, '2 years; labor audit'),
  (NULL, 'press_applications',    730,   NULL, '2 years'),
  (NULL, 'guest_invitations',     365,   NULL, '1 year'),
  (NULL, 'attendee_tickets',      365,   NULL, '1 year')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- STEP 5: Audit events canonical
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id   uuid,
  actor_role      text,
  entity_type     text NOT NULL,
  entity_id       uuid,
  action          text NOT NULL,
  before          jsonb,
  after           jsonb,
  ip_addr         inet,
  user_agent      text,
  at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity
  ON public.audit_events(entity_type, entity_id, at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
  ON public.audit_events(actor_user_id, at DESC) WHERE actor_user_id IS NOT NULL;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_events_org_read ON public.audit_events
  FOR SELECT USING (organization_id IS NULL OR organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 6: Role lifecycle exceptions
-- ─────────────────────────────────────────────────────────────

CREATE TYPE role_lifecycle_exception_kind AS ENUM (
  'cancellation','no_show','reassignment','force_majeure',
  'change_order','dispute','chargeback','credential_revocation',
  'incident','tax_correction'
);

CREATE TABLE IF NOT EXISTS public.role_lifecycle_exceptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_user_id uuid,
  project_id      uuid,
  subject_user_id uuid,
  kind            role_lifecycle_exception_kind NOT NULL,
  raised_by       uuid NOT NULL,
  raised_at       timestamptz NOT NULL DEFAULT now(),
  resolved_by     uuid,
  resolved_at     timestamptz,
  resolution      text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_role_exceptions_kind_at
  ON public.role_lifecycle_exceptions(kind, raised_at DESC);

ALTER TABLE public.role_lifecycle_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_exceptions_org_scope ON public.role_lifecycle_exceptions
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 7: Classification crosswalks (UNSPSC/NIGP/NAICS)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.classification_crosswalks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uac_cat_code    text,
  uac_sub_code    text,
  project_role    project_role,
  unspsc_code     text,
  nigp_code       text,
  naics_code      text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_classification_xw_uac_role
  ON public.classification_crosswalks(COALESCE(uac_sub_code,''), COALESCE(project_role::text,''));

ALTER TABLE public.classification_crosswalks ENABLE ROW LEVEL SECURITY;
CREATE POLICY class_xw_read ON public.classification_crosswalks FOR SELECT USING (true);
CREATE POLICY class_xw_write ON public.classification_crosswalks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.status  = 'active'
      AND r.name IN ('platform_superadmin','platform_admin','owner','admin')
  )
);

-- Seed baseline crosswalk rows for each canonical project role.
INSERT INTO public.classification_crosswalks (project_role, naics_code, notes) VALUES
  ('executive', '5511', 'Management of Companies and Enterprises'),
  ('production','7120', 'Performing Arts, Spectator Sports, and Related'),
  ('management','5612', 'Facilities Support Services'),
  ('crew',      '7115', 'Independent Artists, Writers, and Performers'),
  ('staff',     '5612', 'Facilities Support Services'),
  ('talent',    '7111', 'Performing Arts Companies'),
  ('vendor',    NULL,   'Mapped per vendor via uac_sub_code'),
  ('client',    '5418', 'Advertising, PR, and Related Services'),
  ('sponsor',   '5418', 'Advertising, PR, and Related Services'),
  ('press',     '5111', 'Newspaper, Periodical, Book, and Directory Publishers'),
  ('guest',     NULL,   'Consumer — no external classification'),
  ('attendee',  NULL,   'Consumer — no external classification')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- STEP 8: Incidents (if not already present)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE incident_severity AS ENUM ('info','low','moderate','high','critical');

CREATE TABLE IF NOT EXISTS public.incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id      uuid,
  severity        incident_severity NOT NULL DEFAULT 'low',
  category        text,
  title           text NOT NULL,
  description     text,
  involved_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  related_shift_id uuid,
  related_zone_id uuid,
  reported_by     uuid,
  resolved_at     timestamptz,
  resolution      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_project_severity
  ON public.incidents(project_id, severity);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY incidents_org_scope ON public.incidents
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ============================================================
-- End of 00157
-- ============================================================
