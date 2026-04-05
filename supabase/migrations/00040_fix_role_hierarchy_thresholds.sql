-- =============================================================================
-- Migration 00040: Fix Producer/Admin Role Hierarchy Thresholds
-- =============================================================================
-- The is_producer_role() function checks hierarchy_level <= 5, but the Harbor
-- Master seed uses hierarchy_level 10 for org owner and 20 for org admin.
-- Similarly is_org_admin_or_above() checks <= 2, but owner is level 10.
--
-- Fix: Adjust thresholds to match the actual seeded hierarchy levels.
-- - Owner: 10, Admin: 20, Manager: 30, Member: 40, Viewer: 50, Guest: 60
-- =============================================================================

-- is_org_admin_or_above: owner(10) + admin(20) → threshold <= 20
CREATE OR REPLACE FUNCTION is_org_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.hierarchy_level <= 20
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_producer_role: all internal staff (owner through member, not viewers/guests)
-- owner(10), admin(20), manager(30), member(40) → threshold <= 40
CREATE OR REPLACE FUNCTION is_producer_role()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.hierarchy_level <= 40
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_super_admin: platform_superadmin(0) + platform_admin(1) → threshold <= 1
-- (This one was already correct, but re-state for clarity)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.roles r ON r.id = om.role_id
    WHERE om.user_id = auth.uid()
      AND om.status = 'active'
      AND r.scope = 'platform'
      AND r.hierarchy_level <= 1
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
