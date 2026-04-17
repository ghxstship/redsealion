-- ============================================================
-- 00153: People + Orgs Canonical SSOT (additive phase)
--
-- Closes closure tickets C-DATA-05, C-DATA-08, C-DATA-09 from
-- docs/audit/role-lifecycle/05-closure-plan.md.
--
-- This is PHASE 3a (additive). Canonical tables and pointers
-- are introduced without switching any reader. Phase 3b in a
-- later migration flips readers and deprecates duplicate rows.
--
-- Adds:
--   1. public.people — canonical person SSOT (spans users +
--      non-platform person types like guests / attendees / press).
--   2. public.sponsors — dedicated sponsor table split from clients.
--   3. orgs_canonical view — unified read surface over
--      organizations + vendors + clients + sponsors.
--   4. FK columns (nullable) on subtype person tables pointing
--      to people.id, to be populated by a backfill script.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: people canonical
-- ─────────────────────────────────────────────────────────────

CREATE TYPE person_source AS ENUM ('platform_user','contact','guest','attendee','press','talent','crew_member','staff_member','vendor_contact','system');

CREATE TABLE IF NOT EXISTS public.people (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source             person_source NOT NULL DEFAULT 'contact',
  -- Optional link to auth.users for people with a platform account.
  user_id            uuid,
  external_ref       text,
  full_name          text NOT NULL,
  email              text,
  phone              text,
  country_code       text,
  timezone           text,
  notes              text,
  is_active          boolean NOT NULL DEFAULT true,
  deleted_at         timestamptz,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- (org_id + user_id) uniqueness when a platform user; partial index below.
  UNIQUE (organization_id, external_ref)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_user_org
  ON public.people(organization_id, user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_people_org_source
  ON public.people(organization_id, source);

CREATE INDEX IF NOT EXISTS idx_people_email
  ON public.people(lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY people_org_scope ON public.people
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

COMMENT ON TABLE public.people IS
  'Canonical WHO SSOT. Unifies platform users and non-platform person subtypes (guests, attendees, press, talent, crew, staff, vendor contacts) under a single identity.';


-- ─────────────────────────────────────────────────────────────
-- STEP 2: sponsors (split from clients)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE sponsor_tier AS ENUM ('title','presenting','platinum','gold','silver','bronze','supporting');

CREATE TABLE IF NOT EXISTS public.sponsors (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id         uuid,
  client_id          uuid,
  name               text NOT NULL,
  tier               sponsor_tier,
  contracted_amount  numeric(14,2) NOT NULL DEFAULT 0,
  brand_guidelines_doc_id uuid,
  activation_ids     uuid[] NOT NULL DEFAULT '{}'::uuid[],
  primary_contact_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  contracted_at      timestamptz,
  is_active          boolean NOT NULL DEFAULT true,
  deleted_at         timestamptz,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_org ON public.sponsors(organization_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_project ON public.sponsors(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY sponsors_org_scope ON public.sponsors
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

-- Optional FK to projects (only if projects exists in this deployment).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='projects') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.sponsors
                 ADD CONSTRAINT sponsors_project_fk
                 FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='clients') THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.sponsors
                 ADD CONSTRAINT sponsors_client_fk
                 FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

COMMENT ON TABLE public.sponsors IS
  'Dedicated sponsor table — split from clients. A sponsor is an org that contracts a sponsorship deal tied to one or more activations within a project.';


-- ─────────────────────────────────────────────────────────────
-- STEP 3: orgs_canonical unified view
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='vendors')
     AND EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='clients') THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.orgs_canonical AS
      SELECT organizations.id, organizations.organization_id AS parent_org_id, organizations.name, 'platform_org'::text AS org_type, organizations.created_at
        FROM public.organizations
      UNION ALL
      SELECT vendors.id, vendors.organization_id AS parent_org_id, vendors.name, 'vendor'::text, vendors.created_at
        FROM public.vendors
      UNION ALL
      SELECT clients.id, clients.organization_id AS parent_org_id, clients.name, 'client'::text, clients.created_at
        FROM public.clients
      UNION ALL
      SELECT sponsors.id, sponsors.organization_id AS parent_org_id, sponsors.name, 'sponsor'::text, sponsors.created_at
        FROM public.sponsors
    $v$;
  ELSE
    RAISE NOTICE 'vendors or clients table not present — orgs_canonical view deferred';
  END IF;
EXCEPTION WHEN undefined_column THEN
  -- organizations.organization_id may not exist; retry without that field.
  EXECUTE $v$
    CREATE OR REPLACE VIEW public.orgs_canonical AS
    SELECT organizations.id, NULL::uuid AS parent_org_id, organizations.name, 'platform_org'::text AS org_type, organizations.created_at
      FROM public.organizations
    UNION ALL
    SELECT vendors.id, vendors.organization_id AS parent_org_id, vendors.name, 'vendor'::text, vendors.created_at
      FROM public.vendors
    UNION ALL
    SELECT clients.id, clients.organization_id AS parent_org_id, clients.name, 'client'::text, clients.created_at
      FROM public.clients
    UNION ALL
    SELECT sponsors.id, sponsors.organization_id AS parent_org_id, sponsors.name, 'sponsor'::text, sponsors.created_at
      FROM public.sponsors
  $v$;
END $$;


-- ─────────────────────────────────────────────────────────────
-- STEP 4: Optional FK columns on subtype tables (nullable)
-- Backfill is operational, not schema-level.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='crew_members') THEN
    EXECUTE 'ALTER TABLE public.crew_members ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crew_members_person ON public.crew_members(person_id) WHERE person_id IS NOT NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='staff_members') THEN
    EXECUTE 'ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE SET NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema='public' AND table_name='talent_records') THEN
    EXECUTE 'ALTER TABLE public.talent_records ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE SET NULL';
  END IF;
END $$;


-- ============================================================
-- End of 00153
-- ============================================================
