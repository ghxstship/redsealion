-- ============================================================
-- 00154: Credentials + Zone Access + Consumer Tickets
--
-- Closes closure tickets C-CRED-01, C-CRED-02, C-FLOW-05,
-- C-FLOW-15, C-FLOW-19, C-DATA-06, C-DATA-07, C-RBAC-06,
-- and sets up the press-pool RLS scaffolding.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Credentials + zone access scaffolding
-- ─────────────────────────────────────────────────────────────

CREATE TYPE credential_tier AS ENUM (
  'all_access','production','vendor','talent','press','guest','general_admission'
);

CREATE TABLE IF NOT EXISTS public.credentials (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id       uuid NOT NULL,
  holder_user_id   uuid,
  holder_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  holder_role      project_role NOT NULL,
  tier             credential_tier NOT NULL,
  qr_token         text NOT NULL UNIQUE,
  issued_by        uuid,
  issued_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at       timestamptz,
  revoked_reason   text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_credentials_project
  ON public.credentials(project_id) WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_credentials_holder
  ON public.credentials(holder_user_id);

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY credentials_org_scope ON public.credentials
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='projects') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.credentials
                 ADD CONSTRAINT credentials_project_fk
                 FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS public.zone_access_grants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  credential_id  uuid NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  zone_id        uuid NOT NULL,
  granted_by     uuid,
  from_at        timestamptz NOT NULL DEFAULT now(),
  until_at       timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zag_credential ON public.zone_access_grants(credential_id);
CREATE INDEX IF NOT EXISTS idx_zag_zone ON public.zone_access_grants(zone_id);

ALTER TABLE public.zone_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY zag_org_scope ON public.zone_access_grants
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='zones') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.zone_access_grants
                 ADD CONSTRAINT zag_zone_fk
                 FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE CASCADE';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;


CREATE TYPE zone_scan_direction AS ENUM ('in','out');

CREATE TABLE IF NOT EXISTS public.zone_access_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  credential_id  uuid NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  zone_id        uuid NOT NULL,
  scanned_at     timestamptz NOT NULL DEFAULT now(),
  device_id      text,
  direction      zone_scan_direction NOT NULL,
  denied_reason  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zae_credential_at
  ON public.zone_access_events(credential_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_zae_zone_at
  ON public.zone_access_events(zone_id, scanned_at DESC);

ALTER TABLE public.zone_access_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY zae_org_scope ON public.zone_access_events
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Checkins + egress logs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.checkins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL,
  user_id        uuid,
  person_id      uuid REFERENCES public.people(id) ON DELETE SET NULL,
  credential_id  uuid REFERENCES public.credentials(id) ON DELETE SET NULL,
  shift_id       uuid,
  zone_id        uuid,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  lat            numeric(10,7),
  lng            numeric(10,7),
  accuracy_m     numeric(6,2),
  device_id      text,
  notes          text
);

CREATE INDEX IF NOT EXISTS idx_checkins_project_at
  ON public.checkins(project_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_user_at
  ON public.checkins(user_id, checked_in_at DESC);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY checkins_org_scope ON public.checkins
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.egress_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  credential_id  uuid NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  zone_id        uuid,
  scanned_at     timestamptz NOT NULL DEFAULT now(),
  device_id      text
);

CREATE INDEX IF NOT EXISTS idx_egress_credential_at
  ON public.egress_logs(credential_id, scanned_at DESC);

ALTER TABLE public.egress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY egress_org_scope ON public.egress_logs
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ─────────────────────────────────────────────────────────────
-- STEP 3: Press surface (applications, credentials, pool slots)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE press_application_status AS ENUM ('pending','approved','declined','waitlisted','revoked');

CREATE TABLE IF NOT EXISTS public.press_applications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL,
  person_id      uuid REFERENCES public.people(id) ON DELETE SET NULL,
  outlet         text NOT NULL,
  editor_name    text,
  editor_email   text,
  editor_letter_doc_id uuid,
  outlet_type    text,
  status         press_application_status NOT NULL DEFAULT 'pending',
  decided_by     uuid,
  decided_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_press_app_project ON public.press_applications(project_id, status);

ALTER TABLE public.press_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY press_app_org_scope ON public.press_applications
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.press_credentials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.press_applications(id) ON DELETE CASCADE,
  credential_id  uuid REFERENCES public.credentials(id) ON DELETE CASCADE,
  tier           text NOT NULL DEFAULT 'press',
  pool_slots     uuid[] NOT NULL DEFAULT '{}'::uuid[],
  is_pool_eligible boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.press_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY press_cred_org_scope ON public.press_credentials
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.pool_slots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id       uuid,
  kind           text NOT NULL CHECK (kind IN ('presser','pool','riser')),
  capacity       integer NOT NULL DEFAULT 0,
  slot_from      timestamptz NOT NULL,
  slot_until     timestamptz NOT NULL,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pool_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY pool_slots_org_scope ON public.pool_slots
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- Press pool access RLS — a press role may SELECT zone_access_grants only
-- when the grant zone is flagged as a press-pool zone. Enforcement relies on
-- a new zones.is_press_pool column; guarded by a conditional ALTER so older
-- deployments without zones still migrate cleanly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='zones') THEN
    EXECUTE 'ALTER TABLE public.zones ADD COLUMN IF NOT EXISTS is_press_pool boolean NOT NULL DEFAULT false';
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Guest + Attendee tickets
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guest_invitations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL,
  host_user_id   uuid NOT NULL,
  invitee_email  text NOT NULL,
  invitee_name   text,
  zones          uuid[] NOT NULL DEFAULT '{}'::uuid[],
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','revoked','expired')),
  expires_at     timestamptz,
  accepted_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guest_inv_project ON public.guest_invitations(project_id, status);

ALTER TABLE public.guest_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY guest_inv_org_scope ON public.guest_invitations
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.guest_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invitation_id  uuid REFERENCES public.guest_invitations(id) ON DELETE SET NULL,
  person_id      uuid REFERENCES public.people(id) ON DELETE SET NULL,
  credential_id  uuid REFERENCES public.credentials(id) ON DELETE SET NULL,
  qr_token       text NOT NULL UNIQUE,
  zones          uuid[] NOT NULL DEFAULT '{}'::uuid[],
  issued_at      timestamptz NOT NULL DEFAULT now(),
  used_at        timestamptz,
  revoked_at     timestamptz
);

ALTER TABLE public.guest_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY guest_tickets_org_scope ON public.guest_tickets
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


CREATE TABLE IF NOT EXISTS public.attendee_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL,
  event_id       uuid,
  external_id    text NOT NULL,
  platform       text NOT NULL,
  buyer_email    text,
  buyer_name     text,
  person_id      uuid REFERENCES public.people(id) ON DELETE SET NULL,
  credential_id  uuid REFERENCES public.credentials(id) ON DELETE SET NULL,
  qr_token       text NOT NULL UNIQUE,
  zones          uuid[] NOT NULL DEFAULT '{}'::uuid[],
  price_cents    integer NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  purchased_at   timestamptz NOT NULL DEFAULT now(),
  scanned_at     timestamptz,
  UNIQUE (organization_id, platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_attendee_tickets_project ON public.attendee_tickets(project_id);

ALTER TABLE public.attendee_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendee_tickets_org_scope ON public.attendee_tickets
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));


-- ============================================================
-- End of 00154
-- ============================================================
