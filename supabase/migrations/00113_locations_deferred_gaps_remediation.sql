-- Migration: Locations Deferred Gaps Remediation
-- Add tags, full-text search, location_files, location_contacts

-- 1. Tags and Full-Text Search for Locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION public.locations_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.type::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.formatted_address, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_locations_search_vector_update ON public.locations;
CREATE TRIGGER trg_locations_search_vector_update
  BEFORE INSERT OR UPDATE OF name, type, formatted_address, tags
  ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.locations_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_locations_search_vector ON public.locations USING GIN (search_vector);

-- Update existing rows to populate search_vector
UPDATE public.locations SET name = name;

-- 2. location_files Table
CREATE TABLE IF NOT EXISTS public.location_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_files_location ON public.location_files(location_id);
CREATE INDEX IF NOT EXISTS idx_location_files_org ON public.location_files(organization_id);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_location_files
    BEFORE UPDATE ON public.location_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.location_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_files_select" ON public.location_files FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "location_files_insert" ON public.location_files FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "location_files_update" ON public.location_files FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "location_files_delete" ON public.location_files FOR DELETE
  USING (organization_id = auth_user_org_id());

-- 3. location_contacts Table
CREATE TABLE IF NOT EXISTS public.location_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'primary',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_contacts_location ON public.location_contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_location_contacts_org ON public.location_contacts(organization_id);

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_location_contacts
    BEFORE UPDATE ON public.location_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.location_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_contacts_select" ON public.location_contacts FOR SELECT
  USING (organization_id = auth_user_org_id());
CREATE POLICY "location_contacts_insert" ON public.location_contacts FOR INSERT
  WITH CHECK (organization_id = auth_user_org_id());
CREATE POLICY "location_contacts_update" ON public.location_contacts FOR UPDATE
  USING (organization_id = auth_user_org_id());
CREATE POLICY "location_contacts_delete" ON public.location_contacts FOR DELETE
  USING (organization_id = auth_user_org_id());
