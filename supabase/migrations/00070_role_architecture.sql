-- ============================================================
-- 00070: Role Architecture Migration
--
-- Migrates org_role enum from legacy 8-role model to canonical
-- 10-role architecture with cleaner internal/external boundary.
--
-- Old → New mapping:
--   super_admin    → developer
--   org_admin      → owner (org creators) / admin (delegated)
--   project_manager→ manager
--   designer       → team_member
--   fabricator     → team_member (merged)
--   installer      → crew
--   client_primary → client
--   client_viewer  → viewer
--
-- New roles added:
--   controller     (finance-scoped internal)
--   contractor   (scoped external)
--
-- Note: users.role was dropped in 00033. Roles are now resolved via
-- organization_memberships.role_id → roles.name → auth_user_role() CASE.
-- RLS helpers already use hierarchy_level comparisons.
-- ============================================================

-- Step 1: Rename existing enum values
ALTER TYPE org_role RENAME VALUE 'super_admin' TO 'developer';
ALTER TYPE org_role RENAME VALUE 'org_admin' TO 'owner';
ALTER TYPE org_role RENAME VALUE 'project_manager' TO 'manager';
ALTER TYPE org_role RENAME VALUE 'designer' TO 'team_member';
ALTER TYPE org_role RENAME VALUE 'client_primary' TO 'client';
ALTER TYPE org_role RENAME VALUE 'client_viewer' TO 'viewer';
ALTER TYPE org_role RENAME VALUE 'installer' TO 'crew';

-- Step 2: Add new enum values
ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'controller';
ALTER TYPE org_role ADD VALUE IF NOT EXISTS 'contractor';

-- Step 3: Update auth_user_role() to map roles.name → new org_role values
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS org_role AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  SELECT r.name INTO v_role_name
  FROM public.organization_memberships om
  JOIN public.roles r ON r.id = om.role_id
  WHERE om.user_id = auth.uid() AND om.status = 'active'
  ORDER BY r.hierarchy_level ASC
  LIMIT 1;

  RETURN CASE v_role_name
    WHEN 'platform_superadmin' THEN 'developer'::org_role
    WHEN 'platform_admin' THEN 'developer'::org_role
    WHEN 'developer_ops' THEN 'developer'::org_role
    WHEN 'developer' THEN 'developer'::org_role
    WHEN 'owner' THEN 'owner'::org_role
    WHEN 'admin' THEN 'admin'::org_role
    WHEN 'controller' THEN 'controller'::org_role
    WHEN 'manager' THEN 'manager'::org_role
    WHEN 'team_member' THEN 'team_member'::org_role
    WHEN 'member' THEN 'team_member'::org_role
    WHEN 'client' THEN 'client'::org_role
    WHEN 'contractor' THEN 'contractor'::org_role
    WHEN 'crew' THEN 'crew'::org_role
    WHEN 'viewer' THEN 'viewer'::org_role
    ELSE 'team_member'::org_role
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 4: Update client_primary reference in addons RLS policy
DROP POLICY IF EXISTS "addons_client_select_toggle" ON phase_addons;
CREATE POLICY "addons_client_select_toggle" ON phase_addons FOR UPDATE
  USING (
    EXISTS(
      SELECT 1 FROM phases ph
      JOIN proposals p ON p.id = ph.proposal_id
      JOIN client_contacts cc ON EXISTS(
        SELECT 1 FROM clients cl WHERE cl.id = p.client_id AND cc.client_id = cl.id
      )
      WHERE ph.id = phase_addons.phase_id
      AND cc.user_id = auth.uid()
      AND auth_user_role() = 'client'
    )
  );

-- Step 5: Update milestone requirements client policy
DROP POLICY IF EXISTS "requirements_client_approve" ON milestone_requirements;
CREATE POLICY "requirements_client_approve" ON milestone_requirements FOR UPDATE
  USING (
    assignee IN ('client', 'both')
    AND auth_user_role() = 'client'
    AND EXISTS(
      SELECT 1 FROM milestone_gates mg
      JOIN phases ph ON ph.id = mg.phase_id
      JOIN proposals p ON p.id = ph.proposal_id
      WHERE mg.id = milestone_requirements.milestone_id
      AND p.organization_id = auth_user_org_id()
    )
  );

-- Step 6: Update Harbor Master roles table to reflect new naming
UPDATE public.roles SET name = 'developer', display_name = 'Developer',
  description = 'Platform operator. Full system access.'
  WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.roles SET name = 'developer_ops', display_name = 'Developer (Ops)',
  description = 'Platform support/ops staff.'
  WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.roles SET name = 'owner', display_name = 'Owner',
  description = 'Organization creator. Full control. Transferable but not removable.'
  WHERE id = '00000000-0000-0000-0000-000000000010';

UPDATE public.roles SET name = 'admin', display_name = 'Admin',
  description = 'Full org management except delete org or transfer ownership.'
  WHERE id = '00000000-0000-0000-0000-000000000020';

UPDATE public.roles SET name = 'manager', display_name = 'Manager',
  description = 'Manage members, projects, teams. No billing or org settings.'
  WHERE id = '00000000-0000-0000-0000-000000000030';

UPDATE public.roles SET name = 'team_member', display_name = 'Team Member',
  description = 'Standard internal access. Assignable to projects and teams.'
  WHERE id = '00000000-0000-0000-0000-000000000040';

UPDATE public.roles SET name = 'viewer', display_name = 'Viewer',
  description = 'Read-only access to assigned resources.'
  WHERE id = '00000000-0000-0000-0000-000000000050';

UPDATE public.roles SET name = 'contractor', display_name = 'Contractor',
  description = 'Scoped external contributor (freelancers, vendors, sub-contractors).'
  WHERE id = '00000000-0000-0000-0000-000000000060';

-- Step 7: Insert new roles
INSERT INTO public.roles (id, name, display_name, description, scope, hierarchy_level, is_system) VALUES
  ('00000000-0000-0000-0000-000000000025', 'controller', 'Controller', 'Finance-scoped admin. Invoices, budgets, expenses, reports.', 'organization', 25, true),
  ('00000000-0000-0000-0000-000000000045', 'crew', 'Crew', 'External crew. Timesheets, work orders, field operations.', 'organization', 45, true),
  ('00000000-0000-0000-0000-000000000055', 'client', 'Client', 'External client. Portal access for proposals, invoices, approvals.', 'organization', 55, true)
ON CONFLICT (id) DO NOTHING;
