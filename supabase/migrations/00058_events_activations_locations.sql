-- =============================================================================
-- Migration: Events, Activations & Locations
-- =============================================================================
-- Introduces 7 new tables to support multi-dimensional project segmentation:
--   1. locations               — Org-scoped reusable physical places (SSOT)
--   2. events                  — Org-scoped temporal occurrences
--   3. activations             — Event+Location scoped work units
--   4. project_events          — M:N junction: project ↔ event
--   5. event_locations         — M:N junction: event ↔ location
--   6. activation_assignments  — M:N junction: activation ↔ project
--   7. project_locations       — M:N shortcut junction: project ↔ location
--
-- Also adds location_id FK to existing venues table for soft migration.
--
-- All tables: org-scoped, RLS-enabled, with updated_at triggers.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. ENUM TYPES
-- ---------------------------------------------------------------------------

-- Location types: 'virtual' allows activations to always require a location_id
CREATE TYPE public.location_type AS ENUM (
  'venue',
  'arena',
  'stadium',
  'convention_center',
  'hotel',
  'outdoor',
  'warehouse',
  'office',
  'studio',
  'restaurant',
  'virtual',
  'other'
);

CREATE TYPE public.event_type AS ENUM (
  'festival',
  'conference',
  'corporate',
  'concert',
  'sports',
  'ceremony',
  'broadcast',
  'exhibition',
  'tour',
  'gala',
  'wedding',
  'production',
  'other'
);

CREATE TYPE public.activation_type AS ENUM (
  'stage',
  'booth',
  'hospitality',
  'installation',
  'catering',
  'vip_area',
  'green_room',
  'backstage',
  'merchandise',
  'experiential',
  'broadcast',
  'signage',
  'general',
  'other'
);


-- ---------------------------------------------------------------------------
-- 1. locations — Org-scoped reusable physical places
-- ---------------------------------------------------------------------------
-- Canonical SSOT for all venue/location data. Replaces the pattern of
-- inlining venue_name/venue_address on projects and proposals.

CREATE TABLE IF NOT EXISTS public.locations (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              TEXT              NOT NULL,
  slug              TEXT              NOT NULL,
  type              public.location_type NOT NULL DEFAULT 'venue',
  -- Structured address fields
  address           JSONB             NOT NULL DEFAULT '{}'::jsonb,
  formatted_address TEXT,
  phone             TEXT,
  timezone          TEXT,
  capacity          INTEGER,
  site_map_url      TEXT,
  -- Google Maps / Places API integration
  google_place_id   TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  notes             TEXT,
  status            TEXT              NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_locations_org    ON public.locations(organization_id);
CREATE INDEX idx_locations_type   ON public.locations(organization_id, type);
CREATE INDEX idx_locations_status ON public.locations(organization_id, status);

CREATE TRIGGER set_updated_at_locations
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 2. events — Org-scoped temporal occurrences
-- ---------------------------------------------------------------------------
-- An event is "what's happening" — named occurrences with dates.
-- Examples: "Opening Ceremony", "MMW26 Open Air", "Day 1 — Athletics"

CREATE TABLE IF NOT EXISTS public.events (
  id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             TEXT              NOT NULL,
  slug             TEXT              NOT NULL,
  subtitle         TEXT,
  type             public.event_type NOT NULL DEFAULT 'production',
  status           TEXT              NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  daily_hours      TEXT,
  doors_time       TEXT,
  general_email    TEXT,
  presenter        TEXT,
  event_code       TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_events_org    ON public.events(organization_id);
CREATE INDEX idx_events_status ON public.events(organization_id, status);
CREATE INDEX idx_events_dates  ON public.events(starts_at, ends_at);

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 3. activations — Event+Location scoped work units
-- ---------------------------------------------------------------------------
-- An activation is a specific deliverable or experience within an event
-- at a specific location. location_id is required — use a location with
-- type='virtual' for non-physical activations.
-- Examples: "VIP Hospitality Suite", "Sponsor Booth #3", "Main Stage Build".

CREATE TABLE IF NOT EXISTS public.activations (
  id               UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID                   NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id         UUID                   NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  location_id      UUID                   NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  name             TEXT                   NOT NULL,
  type             public.activation_type NOT NULL DEFAULT 'general',
  status           TEXT                   NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  load_in          JSONB,
  strike           JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ            NOT NULL DEFAULT now()
);

CREATE INDEX idx_activations_org      ON public.activations(organization_id);
CREATE INDEX idx_activations_event    ON public.activations(event_id);
CREATE INDEX idx_activations_location ON public.activations(location_id);
CREATE INDEX idx_activations_status   ON public.activations(organization_id, status);

CREATE TRIGGER set_updated_at_activations
  BEFORE UPDATE ON public.activations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 4. project_events — M:N junction: project ↔ event
-- ---------------------------------------------------------------------------
-- Which events does this project service?

CREATE TABLE IF NOT EXISTS public.project_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_id         UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, event_id)
);

CREATE INDEX idx_project_events_project ON public.project_events(project_id);
CREATE INDEX idx_project_events_event   ON public.project_events(event_id);

-- ---------------------------------------------------------------------------
-- 5. event_locations — M:N junction: event ↔ location
-- ---------------------------------------------------------------------------
-- Which locations host this event?

CREATE TABLE IF NOT EXISTS public.event_locations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  location_id      UUID        NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  is_primary       BOOLEAN     NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, location_id)
);

CREATE INDEX idx_event_locations_event    ON public.event_locations(event_id);
CREATE INDEX idx_event_locations_location ON public.event_locations(location_id);

-- ---------------------------------------------------------------------------
-- 6. activation_assignments — M:N junction: activation ↔ project
-- ---------------------------------------------------------------------------
-- Which projects are responsible for this activation?

CREATE TABLE IF NOT EXISTS public.activation_assignments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  activation_id    UUID        NOT NULL REFERENCES public.activations(id) ON DELETE CASCADE,
  project_id       UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activation_id, project_id)
);

CREATE INDEX idx_activation_assignments_activation ON public.activation_assignments(activation_id);
CREATE INDEX idx_activation_assignments_project    ON public.activation_assignments(project_id);

-- ---------------------------------------------------------------------------
-- 7. project_locations — M:N shortcut: project ↔ location
-- ---------------------------------------------------------------------------
-- Direct relationship for query convenience. Denormalized shortcut that
-- simplifies "show me all locations for this project" without traversing
-- project → event → event_location → location.

CREATE TABLE IF NOT EXISTS public.project_locations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  location_id      UUID        NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  is_primary       BOOLEAN     NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, location_id)
);

CREATE INDEX idx_project_locations_project  ON public.project_locations(project_id);
CREATE INDEX idx_project_locations_location ON public.project_locations(location_id);

-- ---------------------------------------------------------------------------
-- 8. Soft migration: Add location_id FK to existing venues table
-- ---------------------------------------------------------------------------
-- Links legacy proposal-scoped venues to canonical org-scoped locations.
-- Nullable to allow incremental migration.

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venues_location ON public.venues(location_id) WHERE location_id IS NOT NULL;


-- =============================================================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================================================

ALTER TABLE public.locations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_locations      ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- locations — org members can read, admins can manage
-- ---------------------------------------------------------------------------
CREATE POLICY locations_select ON public.locations
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY locations_insert ON public.locations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY locations_update ON public.locations
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY locations_delete ON public.locations
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- events — org members can read, admins can manage
-- ---------------------------------------------------------------------------
CREATE POLICY events_select ON public.events
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY events_insert ON public.events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY events_update ON public.events
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY events_delete ON public.events
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- activations — org members can read, admins can manage
-- ---------------------------------------------------------------------------
CREATE POLICY activations_select ON public.activations
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activations_insert ON public.activations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activations_update ON public.activations
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activations_delete ON public.activations
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- project_events — accessible if user is in the project's org
-- ---------------------------------------------------------------------------
CREATE POLICY project_events_select ON public.project_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_events.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_events_insert ON public.project_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_events.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_events_update ON public.project_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_events.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_events_delete ON public.project_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_events.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- event_locations — accessible if user is in the event's org
-- ---------------------------------------------------------------------------
CREATE POLICY event_locations_select ON public.event_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_memberships om ON om.organization_id = e.organization_id
      WHERE e.id = event_locations.event_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY event_locations_insert ON public.event_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_memberships om ON om.organization_id = e.organization_id
      WHERE e.id = event_locations.event_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY event_locations_update ON public.event_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_memberships om ON om.organization_id = e.organization_id
      WHERE e.id = event_locations.event_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY event_locations_delete ON public.event_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.organization_memberships om ON om.organization_id = e.organization_id
      WHERE e.id = event_locations.event_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- activation_assignments — accessible if user is in the project's org
-- ---------------------------------------------------------------------------
CREATE POLICY activation_assignments_select ON public.activation_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = activation_assignments.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activation_assignments_insert ON public.activation_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = activation_assignments.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activation_assignments_update ON public.activation_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = activation_assignments.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY activation_assignments_delete ON public.activation_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = activation_assignments.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- project_locations — accessible if user is in the project's org
-- ---------------------------------------------------------------------------
CREATE POLICY project_locations_select ON public.project_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_locations.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_locations_insert ON public.project_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_locations.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_locations_update ON public.project_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_locations.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );

CREATE POLICY project_locations_delete ON public.project_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_memberships om ON om.organization_id = p.organization_id
      WHERE p.id = project_locations.project_id
      AND om.user_id = auth.uid() AND om.status = 'active'
    )
  );
