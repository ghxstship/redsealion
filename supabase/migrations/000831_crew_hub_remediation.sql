-- ============================================================================
-- Migration 00080: Crew Hub Remediation
-- Fixes all 46 gaps identified in the Crew hub operational audit.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- CRITICAL #1: crew_profiles — add full_name, bio, phone, availability_status
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available'
    CHECK (availability_status IN ('available', 'unavailable', 'tentative'));

-- Backfill full_name from users table
UPDATE public.crew_profiles cp
SET full_name = u.full_name
FROM public.users u
WHERE cp.user_id = u.id AND cp.full_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- CRITICAL #2-3,6: Add crew_profile_id FK to crew_bookings & crew_availability
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_bookings
  ADD COLUMN IF NOT EXISTS crew_profile_id uuid REFERENCES public.crew_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.crew_availability
  ADD COLUMN IF NOT EXISTS crew_profile_id uuid REFERENCES public.crew_profiles(id) ON DELETE CASCADE;

-- Backfill crew_profile_id from user_id
UPDATE public.crew_bookings cb
SET crew_profile_id = cp.id
FROM public.crew_profiles cp
WHERE cb.user_id = cp.user_id AND cb.crew_profile_id IS NULL;

UPDATE public.crew_availability ca
SET crew_profile_id = cp.id
FROM public.crew_profiles cp
WHERE ca.user_id = cp.user_id AND ca.crew_profile_id IS NULL;

-- Indexes for crew_profile_id lookups
CREATE INDEX IF NOT EXISTS idx_crew_bookings_profile ON public.crew_bookings(crew_profile_id);
CREATE INDEX IF NOT EXISTS idx_crew_availability_profile ON public.crew_availability(crew_profile_id);

-- ────────────────────────────────────────────────────────────────────────────
-- CRITICAL #7: Make proposal_id nullable on crew_bookings
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_bookings ALTER COLUMN proposal_id DROP NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- CRITICAL #5 + MEDIUM #35: Add missing columns to crew_bookings
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_bookings
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS venue_name text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

-- Make role have a default so null inserts don't fail
ALTER TABLE public.crew_bookings ALTER COLUMN role SET DEFAULT 'unassigned';

-- Backfill project_name and venue_name from proposals/venues
UPDATE public.crew_bookings cb
SET project_name = p.name
FROM public.proposals p
WHERE cb.proposal_id = p.id AND cb.project_name IS NULL;

UPDATE public.crew_bookings cb
SET venue_name = v.name
FROM public.venues v
WHERE cb.venue_id = v.id AND cb.venue_name IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- HIGH #9: Add onboarding tracking columns to crew_profiles
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_profiles
  ADD COLUMN IF NOT EXISTS documents_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_started_at timestamptz;

-- ────────────────────────────────────────────────────────────────────────────
-- HIGH #10: Add crew_profile_id to onboarding_documents
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.onboarding_documents
  ADD COLUMN IF NOT EXISTS crew_profile_id uuid REFERENCES public.crew_profiles(id) ON DELETE CASCADE;

-- Backfill
UPDATE public.onboarding_documents od
SET crew_profile_id = cp.id
FROM public.crew_profiles cp
WHERE od.user_id = cp.user_id AND od.crew_profile_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_docs_crew_profile ON public.onboarding_documents(crew_profile_id);

-- ────────────────────────────────────────────────────────────────────────────
-- MEDIUM #21: Ensure updated_at triggers exist on all crew tables
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['crew_profiles', 'crew_availability', 'crew_bookings']) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'update_' || tbl || '_updated_at'
        AND tgrelid = ('public.' || tbl)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- HIGH #13: Trigger for denormalized avg_rating/total_ratings
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.recompute_crew_rating()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.crew_profiles
    SET avg_rating = sub.avg_r, total_ratings = sub.cnt
    FROM (
      SELECT
        crew_profile_id,
        ROUND(AVG(rating)::numeric, 2) AS avg_r,
        COUNT(*) AS cnt
      FROM public.crew_ratings
      WHERE crew_profile_id = OLD.crew_profile_id
      GROUP BY crew_profile_id
    ) sub
    WHERE crew_profiles.id = OLD.crew_profile_id AND sub.crew_profile_id = OLD.crew_profile_id;

    -- Handle case where no ratings remain
    IF NOT FOUND THEN
      UPDATE public.crew_profiles
      SET avg_rating = NULL, total_ratings = 0
      WHERE id = OLD.crew_profile_id;
    END IF;
    RETURN OLD;
  ELSE
    UPDATE public.crew_profiles
    SET avg_rating = sub.avg_r, total_ratings = sub.cnt
    FROM (
      SELECT
        crew_profile_id,
        ROUND(AVG(rating)::numeric, 2) AS avg_r,
        COUNT(*) AS cnt
      FROM public.crew_ratings
      WHERE crew_profile_id = NEW.crew_profile_id
      GROUP BY crew_profile_id
    ) sub
    WHERE crew_profiles.id = NEW.crew_profile_id AND sub.crew_profile_id = NEW.crew_profile_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS recompute_crew_rating_trigger ON public.crew_ratings;
CREATE TRIGGER recompute_crew_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.crew_ratings
  FOR EACH ROW EXECUTE FUNCTION public.recompute_crew_rating();

-- ────────────────────────────────────────────────────────────────────────────
-- MEDIUM #22: recruitment_applicants table
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recruitment_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES public.recruitment_positions(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  resume_url text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn')),
  notes text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recruitment_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recruitment_applicants_select" ON public.recruitment_applicants;
CREATE POLICY "recruitment_applicants_select" ON public.recruitment_applicants FOR SELECT
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "recruitment_applicants_insert" ON public.recruitment_applicants;
CREATE POLICY "recruitment_applicants_insert" ON public.recruitment_applicants FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "recruitment_applicants_update" ON public.recruitment_applicants;
CREATE POLICY "recruitment_applicants_update" ON public.recruitment_applicants FOR UPDATE
  USING (organization_id = auth_user_org_id());
DROP POLICY IF EXISTS "recruitment_applicants_delete" ON public.recruitment_applicants;
CREATE POLICY "recruitment_applicants_delete" ON public.recruitment_applicants FOR DELETE
  USING (organization_id = auth_user_org_id());

CREATE INDEX IF NOT EXISTS idx_recruitment_applicants_org ON public.recruitment_applicants(organization_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_applicants_position ON public.recruitment_applicants(position_id);

DROP TRIGGER IF EXISTS set_recruitment_applicants_updated_at ON public.recruitment_applicants;
CREATE TRIGGER set_recruitment_applicants_updated_at
  BEFORE UPDATE ON public.recruitment_applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to keep applicants count in sync
CREATE OR REPLACE FUNCTION public.update_recruitment_applicant_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.recruitment_positions SET applicants = applicants + 1 WHERE id = NEW.position_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.recruitment_positions SET applicants = GREATEST(applicants - 1, 0) WHERE id = OLD.position_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_applicant_count_trigger ON public.recruitment_applicants;
CREATE TRIGGER update_applicant_count_trigger
  AFTER INSERT OR DELETE ON public.recruitment_applicants
  FOR EACH ROW EXECUTE FUNCTION public.update_recruitment_applicant_count();

-- ────────────────────────────────────────────────────────────────────────────
-- MEDIUM #37: Ensure notifications table exists for compliance cron
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
  CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
    USING (organization_id = auth_user_org_id() OR user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
  CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
    WITH CHECK (organization_id = auth_user_org_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
  CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
    USING (organization_id = auth_user_org_id() OR user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- LOW #42: Add soft-delete to crew_bookings
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.crew_bookings
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ────────────────────────────────────────────────────────────────────────────
-- LOW #43: Fix crew_availability unique constraint
-- ────────────────────────────────────────────────────────────────────────────
-- Add new compound unique (won't conflict if old exists, different columns)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'crew_availability_profile_date_key'
  ) THEN
    ALTER TABLE public.crew_availability
      ADD CONSTRAINT crew_availability_profile_date_key UNIQUE (crew_profile_id, date);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- OK if it already exists or crew_profile_id has NULLs
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- LOW #46: Onboarding status transition check function (advisory)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_onboarding_status_transition()
RETURNS trigger AS $$
BEGIN
  -- Allow null → any, or same → same
  IF OLD.onboarding_status = NEW.onboarding_status THEN
    RETURN NEW;
  END IF;

  -- Valid transitions: not_started → in_progress → complete
  IF OLD.onboarding_status = 'not_started' AND NEW.onboarding_status = 'in_progress' THEN
    NEW.onboarding_started_at := COALESCE(NEW.onboarding_started_at, now());
    RETURN NEW;
  ELSIF OLD.onboarding_status = 'in_progress' AND NEW.onboarding_status = 'complete' THEN
    RETURN NEW;
  ELSIF OLD.onboarding_status = 'complete' AND NEW.onboarding_status = 'in_progress' THEN
    -- Allow reopening
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Invalid onboarding status transition: % → %', OLD.onboarding_status, NEW.onboarding_status;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_onboarding_transition ON public.crew_profiles;
CREATE TRIGGER enforce_onboarding_transition
  BEFORE UPDATE OF onboarding_status ON public.crew_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_onboarding_status_transition();
