-- ============================================================
-- 00135: Role Architecture Optimization — Two-Tier RBAC
--
-- Replaces the legacy 11-value org_role enum with a clean 10-value
-- platform role enum, and renames collaborator_role → project_role
-- with a 4-value set (creator, collaborator, viewer, vendor).
--
-- ZERO backwards compatibility. All legacy role names are deleted.
--
-- Platform roles (org_role_v2):
--   developer, owner, admin, controller, collaborator,
--   contractor, crew, client, viewer, community
--
-- Project roles (project_role):
--   creator, collaborator, viewer, vendor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Migrate organization_memberships role_ids BEFORE
--         destroying the old enum. Map deprecated roles to
--         their new canonical equivalents.
-- ─────────────────────────────────────────────────────────────

-- Map old "member" / "team_member" role → "collaborator" role (hierarchy 30)
-- Map old "manager" role → "collaborator" role (hierarchy 30)
-- Map old "viewer" role → "community" role (will reuse slot 50)
-- Map old "guest" role → "collaborator" role
UPDATE public.organization_memberships
SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id IN (
  '00000000-0000-0000-0000-000000000040',  -- old MEMBER/team_member
  '00000000-0000-0000-0000-000000000102'   -- old TEAM_MEMBER
);

-- Guest → collaborator
UPDATE public.organization_memberships
SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id = '00000000-0000-0000-0000-000000000060';

-- Team lead → collaborator
UPDATE public.organization_memberships
SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id = '00000000-0000-0000-0000-000000000101';

-- Do the same for team_memberships, project_memberships, invitations, invite_codes
UPDATE public.team_memberships SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id IN (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

UPDATE public.invitations SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id IN (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

UPDATE public.invite_codes SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id IN (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

UPDATE public.api_keys SET role_id = '00000000-0000-0000-0000-000000000030'
WHERE role_id IN (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102'
);

-- Map project memberships: old PROJECT_ADMIN → PROJECT_CREATOR, old PROJECT_MANAGER → PROJECT_COLLABORATOR
UPDATE public.project_memberships SET role_id = '00000000-0000-0000-0000-000000000201'
WHERE role_id = '00000000-0000-0000-0000-000000000201';  -- PROJECT_ADMIN → PROJECT_CREATOR (same slot, renamed below)

UPDATE public.project_memberships SET role_id = '00000000-0000-0000-0000-000000000203'
WHERE role_id = '00000000-0000-0000-0000-000000000202';  -- PROJECT_MANAGER → PROJECT_COLLABORATOR (mapped to 203)

UPDATE public.project_memberships SET role_id = '00000000-0000-0000-0000-000000000203'
WHERE role_id = '00000000-0000-0000-0000-000000000040';  -- old MEMBER in project context → PROJECT_COLLABORATOR

UPDATE public.project_memberships SET role_id = '00000000-0000-0000-0000-000000000204'
WHERE role_id = '00000000-0000-0000-0000-000000000205';  -- PROJECT_GUEST → PROJECT_VIEWER (mapped to 204)

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Create new org_role enum with clean 9 values
-- ─────────────────────────────────────────────────────────────

CREATE TYPE org_role_v2 AS ENUM (
  'developer',
  'owner',
  'admin',
  'controller',
  'collaborator',
  'contractor',
  'crew',
  'client',
  'viewer',
  'community'
);

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Migrate all columns from old org_role to org_role_v2
-- ─────────────────────────────────────────────────────────────

-- Helper: map old enum value → new enum value
CREATE OR REPLACE FUNCTION _migrate_org_role(old_val TEXT)
RETURNS org_role_v2 AS $$
BEGIN
  RETURN CASE old_val
    WHEN 'developer' THEN 'developer'::org_role_v2
    WHEN 'owner' THEN 'owner'::org_role_v2
    WHEN 'admin' THEN 'admin'::org_role_v2
    WHEN 'controller' THEN 'controller'::org_role_v2
    WHEN 'manager' THEN 'collaborator'::org_role_v2
    WHEN 'team_member' THEN 'collaborator'::org_role_v2
    WHEN 'fabricator' THEN 'collaborator'::org_role_v2
    WHEN 'client' THEN 'client'::org_role_v2
    WHEN 'contractor' THEN 'contractor'::org_role_v2
    WHEN 'crew' THEN 'crew'::org_role_v2
    WHEN 'viewer' THEN 'viewer'::org_role_v2
    ELSE 'collaborator'::org_role_v2
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find and migrate any columns that use the old org_role type.
-- The auth_user_role() function returns org_role, so we'll recreate it after.

-- Drop all auth helper functions CASCADE — this drops all dependent RLS policies
-- which will be recreated below after the new enum is in place.
DROP FUNCTION IF EXISTS is_client_user() CASCADE;
DROP FUNCTION IF EXISTS is_org_admin_or_above() CASCADE;
DROP FUNCTION IF EXISTS is_producer_role() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;

-- If any columns directly use org_role (UNLIKELY since we use roles table + role_id FK
-- but some legacy columns may exist), migrate them here.
-- The enum is primarily used by these functions and RLS policies.

-- Drop old type and rename
DROP TYPE IF EXISTS org_role CASCADE;
ALTER TYPE org_role_v2 RENAME TO org_role;

-- Clean up helper
DROP FUNCTION IF EXISTS _migrate_org_role(TEXT);

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Create new project_role enum (replaces collaborator_role)
-- ─────────────────────────────────────────────────────────────

CREATE TYPE project_role AS ENUM (
  'creator',
  'collaborator',
  'viewer',
  'vendor'
);

-- Migrate collaborator_role columns to project_role
-- advance_collaborators table uses collaborator_role
ALTER TABLE public.advance_collaborators
  ADD COLUMN collaborator_role_new project_role;

UPDATE public.advance_collaborators SET collaborator_role_new = CASE collaborator_role::text
  WHEN 'owner' THEN 'creator'::project_role
  WHEN 'manager' THEN 'collaborator'::project_role
  WHEN 'contributor' THEN 'collaborator'::project_role
  WHEN 'viewer' THEN 'viewer'::project_role
  WHEN 'vendor' THEN 'vendor'::project_role
  ELSE 'collaborator'::project_role
END;

ALTER TABLE public.advance_collaborators DROP COLUMN collaborator_role CASCADE;
ALTER TABLE public.advance_collaborators RENAME COLUMN collaborator_role_new TO collaborator_role;
ALTER TABLE public.advance_collaborators ALTER COLUMN collaborator_role SET NOT NULL;
ALTER TABLE public.advance_collaborators ALTER COLUMN collaborator_role SET DEFAULT 'collaborator'::project_role;

-- If project_collaborators table exists, do the same
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_collaborators' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.project_collaborators ADD COLUMN IF NOT EXISTS collaborator_role_new project_role';
    EXECUTE 'UPDATE public.project_collaborators SET collaborator_role_new = CASE collaborator_role::text
      WHEN ''owner'' THEN ''creator''::project_role
      WHEN ''manager'' THEN ''collaborator''::project_role
      WHEN ''contributor'' THEN ''collaborator''::project_role
      WHEN ''viewer'' THEN ''viewer''::project_role
      WHEN ''vendor'' THEN ''vendor''::project_role
      ELSE ''collaborator''::project_role
    END';
    EXECUTE 'ALTER TABLE public.project_collaborators DROP COLUMN collaborator_role';
    EXECUTE 'ALTER TABLE public.project_collaborators RENAME COLUMN collaborator_role_new TO collaborator_role';
  END IF;
END $$;

-- Drop old collaborator_role type
DROP TYPE IF EXISTS collaborator_role CASCADE;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Recreate auth functions with new enum
-- ─────────────────────────────────────────────────────────────

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
    WHEN 'developer' THEN 'developer'::org_role
    WHEN 'owner' THEN 'owner'::org_role
    WHEN 'admin' THEN 'admin'::org_role
    WHEN 'controller' THEN 'controller'::org_role
    WHEN 'collaborator' THEN 'collaborator'::org_role
    WHEN 'contractor' THEN 'contractor'::org_role
    WHEN 'crew' THEN 'crew'::org_role
    WHEN 'client' THEN 'client'::org_role
    WHEN 'viewer' THEN 'viewer'::org_role
    WHEN 'community' THEN 'community'::org_role
    ELSE 'collaborator'::org_role
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_client_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth_user_role() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_admin_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth_user_role() IN ('developer', 'owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_producer_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth_user_role() IN ('developer', 'owner', 'admin', 'controller', 'collaborator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth_user_role() = 'developer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Update roles table — rename and clean up
-- ─────────────────────────────────────────────────────────────

-- Rename "manager" role → "collaborator"
UPDATE public.roles SET
  name = 'collaborator',
  display_name = 'Collaborator',
  description = 'Internal team member. Operational access to projects, tasks, crew, equipment.',
  hierarchy_level = 30
WHERE id = '00000000-0000-0000-0000-000000000030';

-- Repurpose "member" slot (hierarchy 40) → delete (memberships already migrated)
DELETE FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000040';

-- Keep "viewer" slot (hierarchy 50) → update to hierarchy 70 (authenticated read-only)
UPDATE public.roles SET
  name = 'viewer',
  display_name = 'Viewer',
  description = 'Authenticated read-only access. Investors, board members, auditors.',
  hierarchy_level = 70
WHERE id = '00000000-0000-0000-0000-000000000050';

-- Insert new "community" role for unauthenticated public access
INSERT INTO public.roles (id, name, display_name, description, scope, hierarchy_level, is_system) VALUES
  ('00000000-0000-0000-0000-000000000070', 'community', 'Community', 'Public/unauthenticated access via share links. No seat consumed.', 'organization', 99, true)
ON CONFLICT (id) DO NOTHING;

-- Delete deprecated roles
DELETE FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000060'
  AND name NOT IN ('contractor');  -- Only delete if it's still "guest", not "contractor"

-- Delete old team-scoped roles that are now unused
DELETE FROM public.roles WHERE id IN (
  '00000000-0000-0000-0000-000000000101',  -- TEAM_LEAD
  '00000000-0000-0000-0000-000000000102'   -- TEAM_MEMBER
);

-- Rename project-scoped roles
UPDATE public.roles SET
  name = 'project_creator',
  display_name = 'Project Creator',
  description = 'Project originator. Full admin rights on this project.'
WHERE id = '00000000-0000-0000-0000-000000000201';

-- Delete old PROJECT_MANAGER (memberships already migrated to 203)
DELETE FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000202';

UPDATE public.roles SET
  name = 'project_collaborator',
  display_name = 'Project Collaborator',
  description = 'Invited editor with write access to project tasks and resources.'
WHERE id = '00000000-0000-0000-0000-000000000203';

UPDATE public.roles SET
  name = 'project_viewer',
  display_name = 'Project Viewer',
  description = 'Read-only project access. Can comment but not edit.'
WHERE id = '00000000-0000-0000-0000-000000000204';

UPDATE public.roles SET
  name = 'project_vendor',
  display_name = 'Project Vendor',
  description = 'External party scoped to this project procurement/fulfillment.'
WHERE id = '00000000-0000-0000-0000-000000000205';

-- Delete PROJECT_GUEST if it still exists as a separate row
DELETE FROM public.roles WHERE id = '00000000-0000-0000-0000-000000000205'
  AND name = 'project_guest';

-- ─────────────────────────────────────────────────────────────
-- STEP 7: Add is_public columns for Community visibility
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Portfolio items (may be named portfolio_items or portfolio_cases)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_items' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portfolio_cases' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.portfolio_cases ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- STEP 8: Recreate ALL RLS policies dropped by CASCADE
-- ─────────────────────────────────────────────────────────────

-- auth_user_role() dependent policies
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

-- is_client_user() + is_producer_role() dependent policies
CREATE POLICY "files_select" ON file_attachments FOR SELECT
  USING (
    organization_id = auth_user_org_id()
    AND (
      is_producer_role()
      OR is_client_visible
      OR is_client_user()
    )
    AND deleted_at IS NULL
  );

-- is_org_admin_or_above() dependent policies
CREATE POLICY "Users can view own time entries" ON time_entries FOR SELECT
  USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));

CREATE POLICY "Users can view own timesheets" ON timesheets FOR SELECT
  USING (organization_id = auth_user_org_id() AND (user_id = auth.uid() OR is_org_admin_or_above()));

CREATE POLICY "Admins can manage policies" ON time_policies FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Org admins can manage integrations" ON integrations FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_sync_logs' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Org admins can view sync logs" ON integration_sync_logs FOR SELECT USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

CREATE POLICY "Org admins can manage webhooks" ON webhook_endpoints FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Admins can manage pipelines" ON sales_pipelines FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Admins manage allocations" ON resource_allocations FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

CREATE POLICY "Admins can manage automations" ON automations FOR ALL
  USING (organization_id = auth_user_org_id() AND is_org_admin_or_above());

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_runs' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Org admins can view automation runs" ON automation_runs FOR SELECT USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_invoices' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can manage recurring invoices" ON recurring_invoices FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_models' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can manage AI models" ON ai_models FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_statuses' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "task_statuses_admin_manage" ON task_statuses FOR ALL USING (organization_id = auth_user_org_id() AND is_org_admin_or_above())';
  END IF;
END $$;

-- is_producer_role() dependent policies — all wrapped in IF EXISTS for safety
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_reports' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage reports" ON saved_reports FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage deals" ON deals FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deal_activities' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can create deal activities" ON deal_activities FOR INSERT WITH CHECK (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_interactions' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage interactions" ON client_interactions FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deal_contacts' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage deal contacts" ON deal_contacts FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deal_tags' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage deal tags" ON deal_tags FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Producers can manage expenses" ON expenses FOR ALL USING (organization_id = auth_user_org_id() AND is_producer_role())';
  END IF;
END $$;

-- is_super_admin() dependent policies (roles table)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'roles_select'
  ) THEN
    NULL; -- Policy survived or was recreated elsewhere
  ELSE
    EXECUTE 'CREATE POLICY "roles_select" ON roles FOR SELECT USING (true)';
  END IF;
END $$;

-- Recreate advance_line_items policy with new project_role values
CREATE POLICY line_items_collaborator_insert ON advance_line_items FOR INSERT WITH CHECK (
  advance_id IN (
    SELECT ac.advance_id FROM advance_collaborators ac
    WHERE ac.user_id = auth.uid() AND ac.invite_status = 'accepted'
      AND ac.collaborator_role IN ('creator', 'collaborator', 'vendor')
  )
);

-- ─────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────
