-- =============================================================================
-- Migration 00136: Atomic Production System (APS)
-- =============================================================================
-- Implements a 6-level hierarchical project architecture:
--   L1 PROJECT → L2 EVENT → L3 ZONE → L4 ACTIVATION → L5 COMPONENT → L6 ITEM
--
-- Physical topology (reusable, event-independent):
--   LOCATION → SPACE
--
-- Intersection: ACTIVATION = SPACE × EVENT (scoped under a ZONE)
--
-- Key changes:
--   1. NEW enums: zone_type, component_type, hierarchy_status
--   2. NEW tables: spaces, zones, components, component_items,
--                  hierarchy_tasks, hierarchy_status_log
--   3. MODIFY tables: projects, events, activations, advance_line_items
--   4. DROP tables: activation_assignments, project_locations (redundant)
--   5. NEW functions: hierarchy_budget_rollup, hierarchy_items_by_vertical
--   6. RLS policies, indexes, triggers for all new tables
--
-- Constraints:
--   - Adjacency list (parent FK) pattern for hierarchy traversal
--   - All tables org-scoped via organization_id
--   - Soft deletes (deleted_at) on all hierarchy tables
--   - Audit trail for status transitions
--   - 4-tier catalog taxonomy is SSOT for vertical classification
--   - Zones are LOGICAL groupings (no location FK)
--   - Activations carry the spatial anchor (space_id → spaces)
-- =============================================================================


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Space types — sub-areas within a location
DO $$ BEGIN
  CREATE TYPE space_type AS ENUM (
    'stage', 'conference_room', 'dressing_room', 'green_room',
    'loading_dock', 'parking_lot', 'terrace', 'ballroom',
    'lobby', 'booth_area', 'open_field', 'rooftop',
    'kitchen', 'storage', 'office', 'gate', 'corridor',
    'restroom_block', 'medical_station', 'broadcast_compound',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Zone types — logical groupings of activations
DO $$ BEGIN
  CREATE TYPE zone_type AS ENUM (
    'vip', 'general_admission', 'backstage', 'front_of_house',
    'production', 'hospitality', 'vendor', 'perimeter',
    'broadcast', 'medical', 'loading', 'parking',
    'sponsor', 'artist', 'press', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Component types — buildable elements within an activation
DO $$ BEGIN
  CREATE TYPE component_type AS ENUM (
    'build', 'install', 'scenic', 'technical', 'hospitality',
    'signage', 'infrastructure', 'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unified lifecycle status — shared by all hierarchy levels
DO $$ BEGIN
  CREATE TYPE hierarchy_status AS ENUM (
    'draft', 'advancing', 'confirmed', 'locked', 'complete', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Fulfillment method — how a component item is sourced
-- Replaces separate Fabrication/Procurement/Rentals hubs with Manifest filters
DO $$ BEGIN
  CREATE TYPE fulfillment_method AS ENUM (
    'build', 'purchase', 'rent', 'internal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 2: SPACES TABLE (Physical topology — reusable sub-areas of locations)
-- ═══════════════════════════════════════════════════════════════════════════════
-- A Space is a reusable, event-independent sub-area within a Location.
-- Examples: "Main Stage", "VIP Lounge", "Loading Dock A", "Dressing Room 3"
-- Parent: location_id → locations
-- Spaces exist independently of any event/project. They describe the physical
-- topology of a venue. Activations reference spaces to anchor production work
-- to physical places.

CREATE TABLE IF NOT EXISTS public.spaces (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id         UUID              NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name                TEXT              NOT NULL,
  slug                TEXT              NOT NULL,
  type                space_type        NOT NULL DEFAULT 'custom',
  description         TEXT,
  -- Physical attributes
  capacity            INTEGER,
  area_sqft           NUMERIC(10,2),
  floor_plan_url      TEXT,
  floor_level         TEXT,
  -- Indoor/outdoor/covered
  environment         TEXT              DEFAULT 'indoor' CHECK (environment IN ('indoor', 'outdoor', 'covered', 'mixed')),
  -- Amenities & infrastructure notes
  has_power           BOOLEAN           DEFAULT false,
  has_water           BOOLEAN           DEFAULT false,
  has_wifi            BOOLEAN           DEFAULT false,
  infrastructure_notes TEXT,
  -- Status
  status              TEXT              NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order          INTEGER           NOT NULL DEFAULT 0,
  -- Audit
  created_by          UUID              REFERENCES public.users(id),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID              REFERENCES public.users(id),
  UNIQUE(organization_id, location_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_spaces_org      ON public.spaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_spaces_location ON public.spaces(location_id);
CREATE INDEX IF NOT EXISTS idx_spaces_type     ON public.spaces(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_spaces_active   ON public.spaces(organization_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_spaces
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 3: L3 ZONES TABLE (Logical grouping of activations at an event)
-- ═══════════════════════════════════════════════════════════════════════════════
-- A Zone is a LOGICAL grouping of activations within an event.
-- It carries NO location FK — it is purely organizational.
-- Examples: "VIP Experience", "Front of House", "Backstage Area", "Perimeter"
-- A zone can group activations across multiple physical spaces.
-- Parent: event_id → events (L2)

CREATE TABLE IF NOT EXISTS public.zones (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id            UUID              NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name                TEXT              NOT NULL,
  slug                TEXT              NOT NULL,
  type                zone_type         NOT NULL DEFAULT 'custom',
  status              hierarchy_status  NOT NULL DEFAULT 'draft',
  description         TEXT,
  color_hex           VARCHAR(7),
  sort_order          INTEGER           NOT NULL DEFAULT 0,
  -- Budget overhead/markup at this level
  overhead_cents      INTEGER           DEFAULT 0,
  markup_pct          NUMERIC(5,2)      DEFAULT 0,
  -- Lifecycle
  status_changed_at   TIMESTAMPTZ,
  status_changed_by   UUID              REFERENCES public.users(id),
  -- Audit
  created_by          UUID              REFERENCES public.users(id),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID              REFERENCES public.users(id),
  UNIQUE(organization_id, event_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_zones_org    ON public.zones(organization_id);
CREATE INDEX IF NOT EXISTS idx_zones_event  ON public.zones(event_id);
CREATE INDEX IF NOT EXISTS idx_zones_status ON public.zones(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_zones_active ON public.zones(organization_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_zones
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 4: MODIFY L4 ACTIVATIONS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Activations = Space × Event, grouped under a Zone.
-- The activation IS the spatial anchor — it carries space_id to bind the
-- production work to a physical place.
-- Existing event_id + location_id columns remain for backward compat during
-- migration; zone_id + space_id are the canonical references going forward.

ALTER TABLE public.activations
  ADD COLUMN IF NOT EXISTS zone_id              UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS space_id             UUID REFERENCES public.spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hierarchy_status     hierarchy_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS overhead_cents       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_pct           NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_changed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by    UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS deleted_by           UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_activations_zone  ON public.activations(zone_id) WHERE zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activations_space ON public.activations(space_id) WHERE space_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 5: L5 COMPONENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════
-- A Component is a buildable/installable element within an activation.
-- Examples: "LED Wall", "Bar Top", "Truss Archway", "DJ Booth"
-- Parent: activation_id → activations (L4)

CREATE TABLE IF NOT EXISTS public.components (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activation_id       UUID              NOT NULL REFERENCES public.activations(id) ON DELETE CASCADE,
  name                TEXT              NOT NULL,
  slug                TEXT              NOT NULL,
  type                component_type    NOT NULL DEFAULT 'custom',
  status              hierarchy_status  NOT NULL DEFAULT 'draft',
  description         TEXT,
  -- Budget overhead/markup at this level
  overhead_cents      INTEGER           DEFAULT 0,
  markup_pct          NUMERIC(5,2)      DEFAULT 0,
  sort_order          INTEGER           NOT NULL DEFAULT 0,
  -- Lifecycle
  status_changed_at   TIMESTAMPTZ,
  status_changed_by   UUID              REFERENCES public.users(id),
  -- Audit
  created_by          UUID              REFERENCES public.users(id),
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,
  deleted_by          UUID              REFERENCES public.users(id),
  UNIQUE(organization_id, activation_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_components_org        ON public.components(organization_id);
CREATE INDEX IF NOT EXISTS idx_components_activation ON public.components(activation_id);
CREATE INDEX IF NOT EXISTS idx_components_status     ON public.components(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_components_active     ON public.components(organization_id) WHERE deleted_at IS NULL;

CREATE TRIGGER set_updated_at_components
  BEFORE UPDATE ON public.components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 6: L6 COMPONENT ITEMS (Junction: component ↔ catalog item)
-- ═══════════════════════════════════════════════════════════════════════════════
-- L6 Items ARE advance_catalog_items rows — this junction records the assignment
-- of a catalog item to a component with quantity, pricing, and duration.
-- This is the atomic unit of the hierarchy and the "cart-addable" unit in
-- Production Advancing.

CREATE TABLE IF NOT EXISTS public.component_items (
  id                    UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  component_id          UUID              NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  catalog_item_id       UUID              NOT NULL REFERENCES public.advance_catalog_items(id) ON DELETE RESTRICT,
  catalog_variant_id    UUID              REFERENCES public.advance_catalog_variants(id) ON DELETE SET NULL,
  -- Quantity & pricing
  quantity              INTEGER           NOT NULL DEFAULT 1,
  unit_price_cents      INTEGER           DEFAULT 0,
  unit_of_measure       unit_of_measure   DEFAULT 'day',
  duration_days         INTEGER           DEFAULT 1,
  -- Computed line total (materialized for rollup performance)
  line_total_cents      INTEGER           GENERATED ALWAYS AS (
    COALESCE(unit_price_cents, 0) * quantity * COALESCE(duration_days, 1)
  ) STORED,
  -- Cart bridge (links to advance_line_items if added via cart)
  advance_line_item_id  UUID              REFERENCES public.advance_line_items(id) ON DELETE SET NULL,
  -- Fulfillment method — how this item is sourced (Manifest filters)
  fulfillment_method    fulfillment_method NOT NULL DEFAULT 'purchase',
  -- Metadata
  notes                 TEXT,
  sort_order            INTEGER           NOT NULL DEFAULT 0,
  -- Audit
  created_by            UUID              REFERENCES public.users(id),
  created_at            TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ       NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ,
  UNIQUE(component_id, catalog_item_id, catalog_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_component_items_org          ON public.component_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_component_items_component    ON public.component_items(component_id);
CREATE INDEX IF NOT EXISTS idx_component_items_catalog      ON public.component_items(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_component_items_variant      ON public.component_items(catalog_variant_id) WHERE catalog_variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_component_items_cart         ON public.component_items(advance_line_item_id) WHERE advance_line_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_component_items_active       ON public.component_items(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_component_items_fulfillment  ON public.component_items(organization_id, fulfillment_method);

CREATE TRIGGER set_updated_at_component_items
  BEFORE UPDATE ON public.component_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 7: HIERARCHY TASKS (Polymorphic junction: task ↔ hierarchy level)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tasks can attach to any level of the hierarchy. Exactly one parent FK is
-- non-null. Status gating: if is_status_gate=true, all such tasks at that
-- level must be complete before the node can transition to gate_target_status.

CREATE TABLE IF NOT EXISTS public.hierarchy_tasks (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id             UUID              NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  -- Polymorphic parent (exactly one must be non-null)
  project_id          UUID              REFERENCES public.projects(id) ON DELETE CASCADE,
  event_id            UUID              REFERENCES public.events(id) ON DELETE CASCADE,
  zone_id             UUID              REFERENCES public.zones(id) ON DELETE CASCADE,
  activation_id       UUID              REFERENCES public.activations(id) ON DELETE CASCADE,
  component_id        UUID              REFERENCES public.components(id) ON DELETE CASCADE,
  -- Status gating
  is_status_gate      BOOLEAN           NOT NULL DEFAULT false,
  gate_target_status  hierarchy_status,
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now(),
  -- Exactly one parent FK must be set
  CONSTRAINT hierarchy_tasks_exactly_one_parent CHECK (
    (CASE WHEN project_id    IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN event_id      IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN zone_id       IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN activation_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN component_id  IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  -- Gate must have target status
  CONSTRAINT hierarchy_tasks_gate_requires_target CHECK (
    (NOT is_status_gate) OR (gate_target_status IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_org        ON public.hierarchy_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_task       ON public.hierarchy_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_project    ON public.hierarchy_tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_event      ON public.hierarchy_tasks(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_zone       ON public.hierarchy_tasks(zone_id) WHERE zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_activation ON public.hierarchy_tasks(activation_id) WHERE activation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hierarchy_tasks_component  ON public.hierarchy_tasks(component_id) WHERE component_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 8: HIERARCHY STATUS LOG (Audit trail for status transitions)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hierarchy_status_log (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type         TEXT              NOT NULL CHECK (entity_type IN (
    'project', 'event', 'zone', 'activation', 'component'
  )),
  entity_id           UUID              NOT NULL,
  from_status         hierarchy_status,
  to_status           hierarchy_status  NOT NULL,
  changed_by          UUID              NOT NULL REFERENCES public.users(id),
  reason              TEXT,
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_status_log_org    ON public.hierarchy_status_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_status_log_entity ON public.hierarchy_status_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_status_log_time   ON public.hierarchy_status_log(created_at DESC);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 9: MODIFY EXISTING TABLES — Add hierarchy-aware columns
-- ═══════════════════════════════════════════════════════════════════════════════

-- L1 Projects: Add hierarchy lifecycle + budget columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS hierarchy_status     hierarchy_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS overhead_cents       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_pct           NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_changed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by    UUID REFERENCES public.users(id);

-- L2 Events: Add hierarchy lifecycle + budget columns
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS hierarchy_status     hierarchy_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS overhead_cents       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_pct           NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_changed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_changed_by    UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS deleted_by           UUID REFERENCES public.users(id);

-- Advance line items: Add component_id bridge for Cart ↔ Hierarchy
ALTER TABLE public.advance_line_items
  ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES public.components(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_advance_line_items_component
  ON public.advance_line_items(component_id) WHERE component_id IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 10: DATA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Step 1: Create Spaces from existing activation locations.
--   For each location_id referenced by an activation, create a "General" space.
-- Step 2: Create Zones from existing event groupings.
--   For each event, create a "General" zone.
-- Step 3: Re-parent activations to the new zones + spaces.
-- Step 4: Drop redundant tables.

-- Step 1: Create spaces from locations referenced by activations
DO $$
DECLARE
  r RECORD;
  new_space_id UUID;
  loc_name TEXT;
  space_slug TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT a.organization_id, a.location_id
    FROM public.activations a
    WHERE a.location_id IS NOT NULL
      AND a.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.spaces s
        WHERE s.location_id = a.location_id
          AND s.organization_id = a.organization_id
      )
  LOOP
    SELECT l.name INTO loc_name FROM public.locations l WHERE l.id = r.location_id;
    space_slug := 'general-' || substr(r.location_id::text, 1, 8);

    INSERT INTO public.spaces (
      organization_id, location_id, name, slug, type, description
    ) VALUES (
      r.organization_id, r.location_id,
      'General — ' || COALESCE(loc_name, 'Unnamed'),
      space_slug, 'custom',
      'Auto-created during APS migration from location: ' || COALESCE(loc_name, 'Unnamed')
    )
    RETURNING id INTO new_space_id;

    -- Set space_id on activations that reference this location
    UPDATE public.activations
    SET space_id = new_space_id
    WHERE organization_id = r.organization_id
      AND location_id = r.location_id
      AND space_id IS NULL;
  END LOOP;
END;
$$;

-- Step 2: Create zones from events that have activations
DO $$
DECLARE
  r RECORD;
  new_zone_id UUID;
  evt_name TEXT;
  zone_slug TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT a.organization_id, a.event_id
    FROM public.activations a
    WHERE a.event_id IS NOT NULL
      AND a.zone_id IS NULL
      AND a.deleted_at IS NULL
  LOOP
    SELECT e.name INTO evt_name FROM public.events e WHERE e.id = r.event_id;
    zone_slug := 'general-' || substr(r.event_id::text, 1, 8);

    INSERT INTO public.zones (
      organization_id, event_id, name, slug, type, status, description
    ) VALUES (
      r.organization_id, r.event_id,
      'General',
      zone_slug, 'custom', 'draft',
      'Auto-created during APS migration for event: ' || COALESCE(evt_name, 'Unnamed')
    )
    RETURNING id INTO new_zone_id;

    -- Re-parent all activations for this event under the new zone
    UPDATE public.activations
    SET zone_id = new_zone_id
    WHERE organization_id = r.organization_id
      AND event_id = r.event_id
      AND zone_id IS NULL;
  END LOOP;
END;
$$;

-- Step 3: Drop redundant tables
DROP TABLE IF EXISTS public.activation_assignments CASCADE;
DROP TABLE IF EXISTS public.project_locations CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 11: ENABLE RLS ON ALL NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.spaces                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hierarchy_status_log  ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 12: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ---------- spaces ----------
CREATE POLICY spaces_select ON public.spaces
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY spaces_insert ON public.spaces
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY spaces_update ON public.spaces
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY spaces_delete ON public.spaces
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------- zones ----------
CREATE POLICY zones_select ON public.zones
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY zones_insert ON public.zones
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY zones_update ON public.zones
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY zones_delete ON public.zones
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------- components ----------
CREATE POLICY components_select ON public.components
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY components_insert ON public.components
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY components_update ON public.components
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY components_delete ON public.components
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------- component_items ----------
CREATE POLICY component_items_select ON public.component_items
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY component_items_insert ON public.component_items
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY component_items_update ON public.component_items
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY component_items_delete ON public.component_items
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------- hierarchy_tasks ----------
CREATE POLICY hierarchy_tasks_select ON public.hierarchy_tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY hierarchy_tasks_insert ON public.hierarchy_tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY hierarchy_tasks_update ON public.hierarchy_tasks
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY hierarchy_tasks_delete ON public.hierarchy_tasks
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- ---------- hierarchy_status_log ----------
CREATE POLICY hierarchy_status_log_select ON public.hierarchy_status_log
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );
CREATE POLICY hierarchy_status_log_insert ON public.hierarchy_status_log
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 13: BUDGET ROLLUP FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Returns the computed budget total for any hierarchy node.
-- Overhead and markup stack upward at each level.
--
-- Usage:
--   SELECT * FROM hierarchy_budget_rollup('component', '<uuid>');
--   SELECT * FROM hierarchy_budget_rollup('activation', '<uuid>');
--   SELECT * FROM hierarchy_budget_rollup('zone', '<uuid>');
--   SELECT * FROM hierarchy_budget_rollup('event', '<uuid>');
--   SELECT * FROM hierarchy_budget_rollup('project', '<uuid>');

CREATE OR REPLACE FUNCTION public.hierarchy_budget_rollup(
  p_entity_type TEXT,
  p_entity_id   UUID
) RETURNS TABLE (
  level               TEXT,
  entity_id           UUID,
  entity_name         TEXT,
  items_total_cents   BIGINT,
  overhead_cents      BIGINT,
  markup_pct          NUMERIC(5,2),
  markup_amount_cents BIGINT,
  subtotal_cents      BIGINT
) AS $$
BEGIN
  -- L5 Component rollup
  IF p_entity_type = 'component' THEN
    RETURN QUERY
    SELECT
      'component'::TEXT,
      c.id,
      c.name,
      COALESCE(SUM(ci.line_total_cents), 0)::BIGINT,
      COALESCE(c.overhead_cents, 0)::BIGINT,
      COALESCE(c.markup_pct, 0),
      ((COALESCE(SUM(ci.line_total_cents), 0) + COALESCE(c.overhead_cents, 0))
       * COALESCE(c.markup_pct, 0) / 100)::BIGINT,
      (COALESCE(SUM(ci.line_total_cents), 0) + COALESCE(c.overhead_cents, 0) +
       ((COALESCE(SUM(ci.line_total_cents), 0) + COALESCE(c.overhead_cents, 0))
        * COALESCE(c.markup_pct, 0) / 100))::BIGINT
    FROM public.components c
    LEFT JOIN public.component_items ci ON ci.component_id = c.id AND ci.deleted_at IS NULL
    WHERE c.id = p_entity_id AND c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.overhead_cents, c.markup_pct;
    RETURN;
  END IF;

  -- L4 Activation rollup (sum of its components)
  IF p_entity_type = 'activation' THEN
    RETURN QUERY
    WITH comp_totals AS (
      SELECT
        c.id,
        COALESCE(SUM(ci.line_total_cents), 0) + COALESCE(c.overhead_cents, 0) +
        ((COALESCE(SUM(ci.line_total_cents), 0) + COALESCE(c.overhead_cents, 0))
         * COALESCE(c.markup_pct, 0) / 100) AS comp_subtotal
      FROM public.components c
      LEFT JOIN public.component_items ci ON ci.component_id = c.id AND ci.deleted_at IS NULL
      WHERE c.activation_id = p_entity_id AND c.deleted_at IS NULL
      GROUP BY c.id, c.overhead_cents, c.markup_pct
    )
    SELECT
      'activation'::TEXT,
      a.id,
      a.name,
      COALESCE(SUM(ct.comp_subtotal), 0)::BIGINT,
      COALESCE(a.overhead_cents, 0)::BIGINT,
      COALESCE(a.markup_pct, 0),
      ((COALESCE(SUM(ct.comp_subtotal), 0) + COALESCE(a.overhead_cents, 0))
       * COALESCE(a.markup_pct, 0) / 100)::BIGINT,
      (COALESCE(SUM(ct.comp_subtotal), 0) + COALESCE(a.overhead_cents, 0) +
       ((COALESCE(SUM(ct.comp_subtotal), 0) + COALESCE(a.overhead_cents, 0))
        * COALESCE(a.markup_pct, 0) / 100))::BIGINT
    FROM public.activations a
    LEFT JOIN comp_totals ct ON true
    WHERE a.id = p_entity_id AND a.deleted_at IS NULL
    GROUP BY a.id, a.name, a.overhead_cents, a.markup_pct;
    RETURN;
  END IF;

  -- L3 Zone rollup (sum of its activations)
  IF p_entity_type = 'zone' THEN
    RETURN QUERY
    WITH act_totals AS (
      SELECT r2.subtotal_cents AS act_subtotal
      FROM public.activations a2
      CROSS JOIN LATERAL public.hierarchy_budget_rollup('activation', a2.id) r2
      WHERE a2.zone_id = p_entity_id AND a2.deleted_at IS NULL
    )
    SELECT
      'zone'::TEXT,
      z.id,
      z.name,
      COALESCE(SUM(at2.act_subtotal), 0)::BIGINT,
      COALESCE(z.overhead_cents, 0)::BIGINT,
      COALESCE(z.markup_pct, 0),
      ((COALESCE(SUM(at2.act_subtotal), 0) + COALESCE(z.overhead_cents, 0))
       * COALESCE(z.markup_pct, 0) / 100)::BIGINT,
      (COALESCE(SUM(at2.act_subtotal), 0) + COALESCE(z.overhead_cents, 0) +
       ((COALESCE(SUM(at2.act_subtotal), 0) + COALESCE(z.overhead_cents, 0))
        * COALESCE(z.markup_pct, 0) / 100))::BIGINT
    FROM public.zones z
    LEFT JOIN act_totals at2 ON true
    WHERE z.id = p_entity_id AND z.deleted_at IS NULL
    GROUP BY z.id, z.name, z.overhead_cents, z.markup_pct;
    RETURN;
  END IF;

  -- L2 Event rollup (sum of its zones)
  IF p_entity_type = 'event' THEN
    RETURN QUERY
    WITH zone_totals AS (
      SELECT r3.subtotal_cents AS zone_subtotal
      FROM public.zones z2
      CROSS JOIN LATERAL public.hierarchy_budget_rollup('zone', z2.id) r3
      WHERE z2.event_id = p_entity_id AND z2.deleted_at IS NULL
    )
    SELECT
      'event'::TEXT,
      e.id,
      e.name,
      COALESCE(SUM(zt.zone_subtotal), 0)::BIGINT,
      COALESCE(e.overhead_cents, 0)::BIGINT,
      COALESCE(e.markup_pct, 0),
      ((COALESCE(SUM(zt.zone_subtotal), 0) + COALESCE(e.overhead_cents, 0))
       * COALESCE(e.markup_pct, 0) / 100)::BIGINT,
      (COALESCE(SUM(zt.zone_subtotal), 0) + COALESCE(e.overhead_cents, 0) +
       ((COALESCE(SUM(zt.zone_subtotal), 0) + COALESCE(e.overhead_cents, 0))
        * COALESCE(e.markup_pct, 0) / 100))::BIGINT
    FROM public.events e
    LEFT JOIN zone_totals zt ON true
    WHERE e.id = p_entity_id AND e.deleted_at IS NULL
    GROUP BY e.id, e.name, e.overhead_cents, e.markup_pct;
    RETURN;
  END IF;

  -- L1 Project rollup (sum of its events via project_events junction)
  IF p_entity_type = 'project' THEN
    RETURN QUERY
    WITH event_totals AS (
      SELECT r4.subtotal_cents AS event_subtotal
      FROM public.project_events pe
      JOIN public.events e2 ON e2.id = pe.event_id AND e2.deleted_at IS NULL
      CROSS JOIN LATERAL public.hierarchy_budget_rollup('event', e2.id) r4
      WHERE pe.project_id = p_entity_id
    )
    SELECT
      'project'::TEXT,
      p.id,
      p.name,
      COALESCE(SUM(et.event_subtotal), 0)::BIGINT,
      COALESCE(p.overhead_cents, 0)::BIGINT,
      COALESCE(p.markup_pct, 0),
      ((COALESCE(SUM(et.event_subtotal), 0) + COALESCE(p.overhead_cents, 0))
       * COALESCE(p.markup_pct, 0) / 100)::BIGINT,
      (COALESCE(SUM(et.event_subtotal), 0) + COALESCE(p.overhead_cents, 0) +
       ((COALESCE(SUM(et.event_subtotal), 0) + COALESCE(p.overhead_cents, 0))
        * COALESCE(p.markup_pct, 0) / 100))::BIGINT
    FROM public.projects p
    LEFT JOIN event_totals et ON true
    WHERE p.id = p_entity_id AND p.deleted_at IS NULL
    GROUP BY p.id, p.name, p.overhead_cents, p.markup_pct;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SECTION 14: CROSS-CUTTING VERTICAL FILTER FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Returns all L6 items within a hierarchy scope matching catalog taxonomy filters.
-- Enables queries like "Show me ALL Audio items across every Zone for Event X"
--
-- Usage:
--   SELECT * FROM hierarchy_items_by_vertical('project', '<uuid>', 'technical', 'audio');
--   SELECT * FROM hierarchy_items_by_vertical('event', '<uuid>', 'labor');
--   SELECT * FROM hierarchy_items_by_vertical('zone', '<uuid>');

CREATE OR REPLACE FUNCTION public.hierarchy_items_by_vertical(
  p_scope_type        TEXT,       -- 'project' | 'event' | 'zone' | 'activation'
  p_scope_id          UUID,
  p_group_slug        TEXT DEFAULT NULL,
  p_category_slug     TEXT DEFAULT NULL,
  p_subcategory_slug  TEXT DEFAULT NULL
) RETURNS TABLE (
  component_item_id   UUID,
  component_id        UUID,
  component_name      TEXT,
  activation_id       UUID,
  activation_name     TEXT,
  space_id            UUID,
  space_name          TEXT,
  zone_id             UUID,
  zone_name           TEXT,
  event_id            UUID,
  event_name          TEXT,
  catalog_item_id     UUID,
  item_name           TEXT,
  item_code           VARCHAR(20),
  group_name          TEXT,
  group_slug          TEXT,
  group_color         VARCHAR(7),
  category_name       TEXT,
  subcategory_name    TEXT,
  quantity            INTEGER,
  line_total_cents    INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id                AS component_item_id,
    cmp.id               AS component_id,
    cmp.name             AS component_name,
    act.id               AS activation_id,
    act.name             AS activation_name,
    sp.id                AS space_id,
    sp.name              AS space_name,
    z.id                 AS zone_id,
    z.name               AS zone_name,
    ev.id                AS event_id,
    ev.name              AS event_name,
    cat_item.id          AS catalog_item_id,
    cat_item.name        AS item_name,
    cat_item.item_code   AS item_code,
    grp.name             AS group_name,
    grp.slug             AS group_slug,
    grp.color_hex        AS group_color,
    cat.name             AS category_name,
    sub.name             AS subcategory_name,
    ci.quantity           AS quantity,
    ci.line_total_cents   AS line_total_cents
  FROM public.component_items ci
  JOIN public.components cmp             ON cmp.id = ci.component_id AND cmp.deleted_at IS NULL
  JOIN public.activations act            ON act.id = cmp.activation_id AND act.deleted_at IS NULL
  JOIN public.zones z                    ON z.id = act.zone_id AND z.deleted_at IS NULL
  JOIN public.events ev                  ON ev.id = z.event_id AND ev.deleted_at IS NULL
  LEFT JOIN public.spaces sp             ON sp.id = act.space_id
  JOIN public.advance_catalog_items cat_item ON cat_item.id = ci.catalog_item_id
  JOIN public.advance_subcategories sub  ON sub.id = cat_item.subcategory_id
  JOIN public.advance_categories cat     ON cat.id = sub.category_id
  JOIN public.advance_category_groups grp ON grp.id = cat.group_id
  WHERE ci.deleted_at IS NULL
    -- Scope filter
    AND (
      (p_scope_type = 'project' AND ev.id IN (
        SELECT pe.event_id FROM public.project_events pe WHERE pe.project_id = p_scope_id
      ))
      OR (p_scope_type = 'event' AND ev.id = p_scope_id)
      OR (p_scope_type = 'zone' AND z.id = p_scope_id)
      OR (p_scope_type = 'activation' AND act.id = p_scope_id)
    )
    -- Taxonomy filter (optional — NULL = no filter at that level)
    AND (p_group_slug IS NULL OR grp.slug = p_group_slug)
    AND (p_category_slug IS NULL OR cat.slug = p_category_slug)
    AND (p_subcategory_slug IS NULL OR sub.slug = p_subcategory_slug)
  ORDER BY ev.name, z.name, act.name, cmp.name, cat_item.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
