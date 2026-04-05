-- =============================================================================
-- Migration 00039: Fix Infinite Recursion in organization_memberships RLS
-- =============================================================================
-- The org_mem_select_peers policy (from 00022_harbor_master.sql) queries
-- organization_memberships from WITHIN an RLS policy ON organization_memberships,
-- causing infinite recursion. Similarly, org_mem_select_own works only for
-- the user's own rows but org_mem_select_peers triggers recursion when
-- trying to see peer memberships.
--
-- Fix: Replace the self-referencing subquery with auth_user_org_id() which is
-- SECURITY DEFINER and bypasses RLS on organization_memberships.
--
-- Also fix similar recursion patterns on team_memberships and project_memberships
-- policies and the sessions_select_admin policy.
-- =============================================================================

-- 1. Fix organization_memberships SELECT policies
DROP POLICY IF EXISTS "org_mem_select_peers" ON public.organization_memberships;

CREATE POLICY "org_mem_select_peers" ON public.organization_memberships
  FOR SELECT
  USING (organization_id = auth_user_org_id());

-- 2. Fix team_memberships SELECT policy (same recursion risk via subquery)
DROP POLICY IF EXISTS "team_mem_select" ON public.team_memberships;

CREATE POLICY "team_mem_select" ON public.team_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id = auth_user_org_id()
  );

-- 3. Fix project_memberships SELECT policy
DROP POLICY IF EXISTS "proj_mem_select" ON public.project_memberships;

CREATE POLICY "proj_mem_select" ON public.project_memberships
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id = auth_user_org_id()
  );

-- 4. Fix sessions_select_admin (deeply nested self-referencing join)
DROP POLICY IF EXISTS "sessions_select_admin" ON public.sessions;

CREATE POLICY "sessions_select_admin" ON public.sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = sessions.user_id
        AND om.organization_id = auth_user_org_id()
        AND om.status = 'active'
    )
  );

-- 5. Fix teams SELECT policy (uses subquery on org_memberships)
DROP POLICY IF EXISTS "teams_select" ON public.teams;

CREATE POLICY "teams_select" ON public.teams
  FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    AND (
      visibility != 'secret'
      OR EXISTS (
        SELECT 1 FROM public.team_memberships tm
        WHERE tm.team_id = id AND tm.user_id = auth.uid() AND tm.status = 'active'
      )
    )
  );

-- 6. Fix projects SELECT policy (uses subquery on org_memberships)
DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'internal'
      AND organization_id = auth_user_org_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.project_memberships pm
      WHERE pm.project_id = id AND pm.user_id = auth.uid() AND pm.status = 'active'
    )
  );

-- 7. Fix roles SELECT policy (uses subquery on org_memberships)
DROP POLICY IF EXISTS "roles_select" ON public.roles;

CREATE POLICY "roles_select" ON public.roles
  FOR SELECT
  USING (
    organization_id IS NULL
    OR organization_id = auth_user_org_id()
    OR is_super_admin()
  );

-- 8. Fix seat_allocations SELECT policy
DROP POLICY IF EXISTS "seats_select" ON public.seat_allocations;

CREATE POLICY "seats_select" ON public.seat_allocations
  FOR SELECT
  USING (organization_id = auth_user_org_id());

-- 9. Fix invitations SELECT (inv_select_received uses subquery on users)
DROP POLICY IF EXISTS "inv_select_received" ON public.invitations;

CREATE POLICY "inv_select_received" ON public.invitations
  FOR SELECT
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 10. Fix invitations UPDATE (inv_update_recipient uses subquery on users)
DROP POLICY IF EXISTS "inv_update_recipient" ON public.invitations;

CREATE POLICY "inv_update_recipient" ON public.invitations
  FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = invited_email
    AND status = 'pending'
  );
