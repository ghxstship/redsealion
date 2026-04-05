-- ============================================================================
-- SaaS Action Matrix: Saved Views Infrastructure
-- Migration: 00034_saved_views
-- 
-- Creates the saved views system required by the SaaS Action Matrix audit.
-- Enables users to save, name, and switch between view configurations
-- (filters, sorts, field visibility, grouping, color rules) per entity.
-- ============================================================================

-- Entity types that support saved views
CREATE TYPE public.view_entity_type AS ENUM (
  'tasks',
  'clients',
  'deals',
  'proposals',
  'invoices',
  'leads',
  'crew',
  'people',
  'assets',
  'equipment',
  'expenses',
  'time_entries',
  'budgets',
  'resources',
  'warehouse'
);

-- View display types
CREATE TYPE public.view_display_type AS ENUM (
  'table',
  'board',
  'calendar',
  'gantt',
  'list',
  'gallery',
  'timeline',
  'form'
);

-- Collaboration modes for saved views
CREATE TYPE public.view_collaboration_type AS ENUM (
  'collaborative',  -- visible and editable by all org members
  'personal',       -- visible only to the creator
  'locked'          -- visible to all but only editable by creator/admin
);

-- ─── Saved Views ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_views (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  entity_type   public.view_entity_type NOT NULL,
  display_type  public.view_display_type NOT NULL DEFAULT 'table',
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,                       -- emoji or icon name

  -- JSONB config blob stores all view state
  config        JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Expected config shape:
  -- {
  --   "filters": [{ "field": "status", "op": "eq", "value": "active" }],
  --   "sorts": [{ "field": "created_at", "direction": "desc" }],
  --   "groupBy": "status",
  --   "fieldVisibility": { "title": true, "status": true, "priority": false },
  --   "fieldOrder": ["title", "status", "assignee", "due_date"],
  --   "rowHeight": "compact" | "default" | "tall",
  --   "pinnedColumns": ["title"],
  --   "colorRules": [{ "field": "priority", "value": "urgent", "color": "#ef4444" }]
  -- }

  collaboration_type public.view_collaboration_type NOT NULL DEFAULT 'collaborative',
  is_default    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  section_id    UUID,                       -- FK to view_sections for grouping

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── View Sections (optional grouping) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.view_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type     public.view_entity_type NOT NULL,
  name            TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_collapsed    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK after both tables exist
ALTER TABLE public.saved_views
  ADD CONSTRAINT saved_views_section_fk
  FOREIGN KEY (section_id) REFERENCES public.view_sections(id) ON DELETE SET NULL;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_saved_views_org_entity ON public.saved_views (organization_id, entity_type);
CREATE INDEX idx_saved_views_creator ON public.saved_views (creator_id);
CREATE INDEX idx_view_sections_org_entity ON public.view_sections (organization_id, entity_type);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_sections ENABLE ROW LEVEL SECURITY;

-- Org members can read all collaborative/locked views + their own personal views
CREATE POLICY saved_views_select ON public.saved_views
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (
      collaboration_type != 'personal'
      OR creator_id = auth.uid()
    )
  );

-- Users can create views in their org
CREATE POLICY saved_views_insert ON public.saved_views
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND creator_id = auth.uid()
  );

-- Users can update their own views; collaborative views can be updated by any member
CREATE POLICY saved_views_update ON public.saved_views
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND (
      creator_id = auth.uid()
      OR collaboration_type = 'collaborative'
    )
  );

-- Only creator or admin can delete
CREATE POLICY saved_views_delete ON public.saved_views
  FOR DELETE USING (
    creator_id = auth.uid()
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      JOIN public.roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid() AND om.status = 'active' AND r.hierarchy_level <= 2
    )
  );

-- View sections: org members can CRUD
CREATE POLICY view_sections_all ON public.view_sections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ─── Updated-at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_saved_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_saved_views_updated_at
  BEFORE UPDATE ON public.saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_saved_views_updated_at();
