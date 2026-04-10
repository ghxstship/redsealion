-- =============================================================================
-- Migration 00101: Events Gap Remediation
-- =============================================================================
-- Resolves Missing Tables and Data Points regarding Event operations:
-- 1. Daily Report Incidents (structured incidents mapped from daily reports)
-- 2. Event Staffing Roles (direct personnel tracking for the event context)
-- 3. Logistics Timings on event_locations junction
-- =============================================================================

-- =============================================================================
-- 1. Modify event_locations (GAP)
-- =============================================================================
ALTER TABLE event_locations
  ADD COLUMN IF NOT EXISTS load_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS load_out_time TIMESTAMPTZ;

-- =============================================================================
-- 2. event_incidents table (GAP)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.event_incidents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  daily_report_id   UUID REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  incident_type     TEXT NOT NULL CHECK (incident_type IN ('health_safety', 'security', 'equipment_damage', 'weather_delay', 'other')),
  description       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'under_investigation')),
  reported_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reported_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_incidents_org ON public.event_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_incidents_event ON public.event_incidents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_incidents_report ON public.event_incidents(daily_report_id);

ALTER TABLE public.event_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_access_incidents" ON public.event_incidents;
CREATE POLICY "org_access_incidents" ON public.event_incidents
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));

DROP TRIGGER IF EXISTS set_updated_at_event_incidents ON public.event_incidents;
CREATE TRIGGER set_updated_at_event_incidents
  BEFORE UPDATE ON public.event_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 3. event_roles table (GAP)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.event_roles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title        TEXT NOT NULL, -- e.g. "Stage Manager", "FOH Engineer"
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id, role_title)
);

CREATE INDEX IF NOT EXISTS idx_event_roles_org ON public.event_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_event_roles_event ON public.event_roles(event_id);
CREATE INDEX IF NOT EXISTS idx_event_roles_user ON public.event_roles(user_id);

ALTER TABLE public.event_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_access_roles" ON public.event_roles;
CREATE POLICY "org_access_roles" ON public.event_roles
  FOR ALL USING (organization_id IN (SELECT user_org_ids()));
