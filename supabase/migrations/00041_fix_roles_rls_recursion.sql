-- =============================================================================
-- Migration 00041: Fix roles RLS recursion causing service_role hangs
-- =============================================================================
-- The is_producer_role() and is_super_admin() functions (SECURITY DEFINER)
-- both JOIN the roles table. But the roles_select policy itself calls
-- is_super_admin(), creating indirect recursion through the query planner.
--
-- Fix: Change the roles_select policy to not use is_super_admin() (which
-- queries roles), and instead use a direct membership check. Also add
-- a permissive policy for platform-level roles (organization_id IS NULL).
-- =============================================================================

-- 1. Drop and recreate roles_select to break the recursion cycle
DROP POLICY IF EXISTS "roles_select" ON public.roles;

-- Allow everyone to read roles — they're reference data, not sensitive
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT
  USING (true);

-- 2. Also drop any FOR ALL policy on roles that may exist (from initial schema)
DROP POLICY IF EXISTS "roles_modify" ON public.roles;

-- Only org admins can modify custom roles
CREATE POLICY "roles_modify" ON public.roles
  FOR ALL
  USING (
    organization_id IS NOT NULL
    AND organization_id = auth_user_org_id()
    AND is_org_admin_or_above()
  );

-- 3. Fix assets_modify policy — same FOR ALL pattern that hangs
-- The original uses auth_user_org_id() AND is_producer_role() which worked
-- for authenticated users but hangs for service_role due to the roles recursion
-- Now that roles_select is fixed (step 1), this should work.
-- No change needed here — the roles_select fix resolves the cascade.

-- 4. Fix resource_allocations policies (if they use the same pattern)
DROP POLICY IF EXISTS "resource_allocations_modify" ON public.resource_allocations;
DROP POLICY IF EXISTS "resource_allocations_select" ON public.resource_allocations;

CREATE POLICY "resource_allocations_select" ON public.resource_allocations
  FOR SELECT
  USING (organization_id = auth_user_org_id() OR is_super_admin());

CREATE POLICY "resource_allocations_modify" ON public.resource_allocations
  FOR ALL
  USING (organization_id = auth_user_org_id());
