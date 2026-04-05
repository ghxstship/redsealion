-- =============================================================================
-- Migration 00038: Remediate public.users RLS Policy Gap
-- =============================================================================
-- Migration 00033 dropped users_select, users_insert, users_update, users_delete
-- policies and the organization_id column but never created replacement policies.
-- With RLS enabled and zero policies, ALL queries against public.users are
-- blocked, causing the application to hang on user lookups.
--
-- The canonical org context now resolves via organization_memberships (SSOT).
-- These policies use the Harbor Master auth_user_org_id() function which reads
-- from organization_memberships to determine the caller's org.
-- =============================================================================

-- Users can view members of the same organization
CREATE POLICY "users_select_same_org" ON public.users
  FOR SELECT
  USING (
    -- Allow reading own profile always
    id = auth.uid()
    -- Allow reading any user in the same org (via memberships)
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = users.id
        AND om.organization_id = auth_user_org_id()
        AND om.status = 'active'
    )
    -- Super admins can see all
    OR is_super_admin()
  );

-- Users can insert their own profile row (triggered on signup)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile; org admins can update any org member
CREATE POLICY "users_update_own_or_admin" ON public.users
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (
      is_org_admin_or_above()
      AND EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.user_id = users.id
          AND om.organization_id = auth_user_org_id()
          AND om.status = 'active'
      )
    )
    OR is_super_admin()
  );

-- Only org admins or super admins can delete user profiles
CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE
  USING (
    is_super_admin()
    OR (
      is_org_admin_or_above()
      AND EXISTS (
        SELECT 1 FROM public.organization_memberships om
        WHERE om.user_id = users.id
          AND om.organization_id = auth_user_org_id()
          AND om.status = 'active'
      )
    )
  );

-- Service role bypass: ensure the service_role can always access users
-- (PostgREST service_role already bypasses RLS, but this is belt-and-suspenders)
