-- ============================================================
-- 00104 — People Module Remediation
-- Fixes all schema gaps identified in the People gap audit.
-- ============================================================

-- ─── 0. Missing fields on users ──────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS employment_type TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS hourly_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ─── 1. Missing Indexes on time_off tables ──────────────────────────────────


CREATE INDEX IF NOT EXISTS idx_time_off_requests_org_date
  ON public.time_off_requests(organization_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_user_status
  ON public.time_off_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_org_status
  ON public.time_off_requests(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_time_off_policies_org
  ON public.time_off_policies(organization_id);

CREATE INDEX IF NOT EXISTS idx_time_off_balances_user_policy
  ON public.time_off_balances(user_id, policy_id);

CREATE INDEX IF NOT EXISTS idx_time_off_balances_org
  ON public.time_off_balances(organization_id);

-- ─── 2. holiday_calendars: add updated_at column + trigger ──────────────────

ALTER TABLE public.holiday_calendars
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_holiday_calendars_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_holiday_calendars_updated_at ON public.holiday_calendars;
    CREATE TRIGGER update_holiday_calendars_updated_at
      BEFORE UPDATE ON public.holiday_calendars
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── 3. Departments lookup table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "dept_select" ON public.departments;
  CREATE POLICY "dept_select" ON public.departments FOR SELECT
    USING (organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "dept_admin_all" ON public.departments;
  CREATE POLICY "dept_admin_all" ON public.departments FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    ) AND public.is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_departments_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
    CREATE TRIGGER update_departments_updated_at
      BEFORE UPDATE ON public.departments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── 4. User Emergency Contacts ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_emergency_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  relationship    TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_emergency_contacts_user
  ON public.user_emergency_contacts(user_id);

ALTER TABLE public.user_emergency_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "emergency_contacts_select" ON public.user_emergency_contacts;
  CREATE POLICY "emergency_contacts_select" ON public.user_emergency_contacts FOR SELECT
    USING (organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "emergency_contacts_manage_own" ON public.user_emergency_contacts;
  CREATE POLICY "emergency_contacts_manage_own" ON public.user_emergency_contacts FOR ALL
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "emergency_contacts_admin_all" ON public.user_emergency_contacts;
  CREATE POLICY "emergency_contacts_admin_all" ON public.user_emergency_contacts FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    ) AND public.is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_emergency_contacts_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_emergency_contacts_updated_at ON public.user_emergency_contacts;
    CREATE TRIGGER update_user_emergency_contacts_updated_at
      BEFORE UPDATE ON public.user_emergency_contacts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── 5. User Documents (HR file storage) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL DEFAULT 'other',
  title           TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       BIGINT DEFAULT 0,
  mime_type       TEXT,
  expires_at      DATE,
  status          TEXT NOT NULL DEFAULT 'active',
  uploaded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user
  ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_org
  ON public.user_documents(organization_id);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_docs_select" ON public.user_documents;
  CREATE POLICY "user_docs_select" ON public.user_documents FOR SELECT
    USING (
      user_id = auth.uid()
      OR (organization_id IN (
        SELECT om.organization_id FROM public.organization_memberships om
        WHERE om.user_id = auth.uid()
      ) AND public.is_org_admin_or_above())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "user_docs_admin_all" ON public.user_documents;
  CREATE POLICY "user_docs_admin_all" ON public.user_documents FOR ALL
    USING (organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid()
    ) AND public.is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_documents_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_documents_updated_at ON public.user_documents;
    CREATE TRIGGER update_user_documents_updated_at
      BEFORE UPDATE ON public.user_documents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ─── 6. RLS: time_off_balances — admin management policy ────────────────────

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins manage balances" ON public.time_off_balances;
  CREATE POLICY "Admins manage balances" ON public.time_off_balances FOR ALL
    USING (organization_id = public.auth_user_org_id() AND public.is_org_admin_or_above());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 7. Add realtime publication for new tables ─────────────────────────────

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;
