-- ============================================================
-- HARBOR MASTER: Seed Data — System Roles, Permissions, Feature Flags, Plans
-- Idempotent — safe to re-run
-- ============================================================

-- ============================================================
-- 1. SYSTEM ROLES
-- ============================================================
INSERT INTO public.roles (id, name, display_name, description, scope, hierarchy_level, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'platform_superadmin', 'Platform Super Admin', 'God mode. Platform operator only.', 'platform', 0, true),
  ('00000000-0000-0000-0000-000000000002', 'platform_admin', 'Platform Admin', 'Platform support/ops staff.', 'platform', 1, true),
  ('00000000-0000-0000-0000-000000000010', 'owner', 'Owner', 'Org creator. Full control. Transferable but not removable.', 'organization', 10, true),
  ('00000000-0000-0000-0000-000000000020', 'admin', 'Admin', 'Full org management except delete org or transfer ownership.', 'organization', 20, true),
  ('00000000-0000-0000-0000-000000000030', 'manager', 'Manager', 'Manage members, projects, teams. No billing or org settings.', 'organization', 30, true),
  ('00000000-0000-0000-0000-000000000040', 'member', 'Member', 'Standard access. Assignable to projects and teams.', 'organization', 40, true),
  ('00000000-0000-0000-0000-000000000050', 'viewer', 'Viewer', 'Read-only access to assigned resources.', 'organization', 50, true),
  ('00000000-0000-0000-0000-000000000060', 'guest', 'Guest', 'Minimal access. Typically external collaborators.', 'organization', 60, true),
  ('00000000-0000-0000-0000-000000000101', 'team_lead', 'Team Lead', 'Full team membership and settings control.', 'team', 10, true),
  ('00000000-0000-0000-0000-000000000102', 'team_member', 'Team Member', 'Standard team participant.', 'team', 20, true),
  ('00000000-0000-0000-0000-000000000201', 'project_admin', 'Project Admin', 'Full project membership, settings, and configuration.', 'project', 10, true),
  ('00000000-0000-0000-0000-000000000202', 'project_manager', 'Project Manager', 'Manage project content and members.', 'project', 20, true),
  ('00000000-0000-0000-0000-000000000203', 'project_member', 'Project Member', 'Standard project participant.', 'project', 30, true),
  ('00000000-0000-0000-0000-000000000204', 'project_viewer', 'Project Viewer', 'Read-only project access.', 'project', 40, true),
  ('00000000-0000-0000-0000-000000000205', 'project_guest', 'Project Guest', 'Minimal project access. External collaborators.', 'project', 50, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. PERMISSION CATALOG
-- ============================================================
INSERT INTO public.permission_catalog (action, resource, scope, description, is_sensitive) VALUES
  -- Organization scope
  ('manage', 'organization', 'organization', 'Full CRUD on org settings, billing, danger zone', true),
  ('read', 'organization', 'organization', 'View org profile and public settings', false),
  ('manage', 'member', 'organization', 'Add, remove, change role of org members', true),
  ('invite', 'member', 'organization', 'Send invitations to org', false),
  ('approve', 'member', 'organization', 'Approve/deny join requests', false),
  ('read', 'member', 'organization', 'View member list', false),
  ('manage', 'team', 'organization', 'Create, edit, delete teams', false),
  ('manage', 'project', 'organization', 'Create, edit, archive projects', false),
  ('manage', 'role', 'organization', 'Create/edit custom roles', true),
  ('manage', 'billing', 'organization', 'View/edit subscription, payment methods', true),
  ('read', 'billing', 'organization', 'View invoices and plan info', false),
  ('manage', 'api_key', 'organization', 'Create/revoke API keys', true),
  ('manage', 'settings', 'organization', 'Org-level configuration', true),
  ('read', 'audit_log', 'organization', 'View audit trail', false),
  ('manage', 'feature_flag', 'organization', 'Toggle org-controllable feature flags', true),
  ('manage', 'invite_code', 'organization', 'Generate, deactivate invite codes', false),
  ('bulk_invite', 'member', 'organization', 'Bulk generate codes, bulk email invites', false),
  ('manage', 'session', 'organization', 'View/revoke sessions of org members', true),
  ('export', 'organization', 'organization', 'Export org data', false),
  ('configure', 'organization', 'organization', 'Configure org auth settings', true),
  -- Team scope
  ('manage', 'member', 'team', 'Add/remove team members, change team roles', false),
  ('invite', 'member', 'team', 'Invite to team', false),
  ('read', 'member', 'team', 'View team roster', false),
  ('manage', 'settings', 'team', 'Edit team settings', false),
  -- Project scope
  ('manage', 'member', 'project', 'Add/remove project members, change project roles', false),
  ('invite', 'member', 'project', 'Invite to project (including external)', false),
  ('approve', 'member', 'project', 'Approve project join requests', false),
  ('read', 'member', 'project', 'View project roster', false),
  ('manage', 'settings', 'project', 'Edit project settings', false),
  ('manage', 'invite_code', 'project', 'Generate project-scoped invite codes', false),
  -- Platform scope
  ('manage', 'organization', 'platform', 'Platform-level org management', true),
  ('manage', 'user', 'platform', 'Platform-level user management', true),
  ('read', 'audit_log', 'platform', 'Platform-wide audit log access', false),
  ('manage', 'feature_flag', 'platform', 'Platform-level feature flag control', true),
  ('impersonate', 'user', 'platform', 'Act as another user', true)
ON CONFLICT (action, resource, scope) DO NOTHING;

-- ============================================================
-- 3. ROLE-PERMISSION MAPPINGS
-- ============================================================

-- Helper: assign all org permissions to a role
DO $$
DECLARE
  v_perm_id UUID;
  v_cursor CURSOR FOR SELECT id FROM public.permission_catalog WHERE scope = 'organization';
BEGIN
  -- Owner: all org permissions
  OPEN v_cursor;
  LOOP
    FETCH v_cursor INTO v_perm_id;
    EXIT WHEN NOT FOUND;
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
      ('00000000-0000-0000-0000-000000000010', v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  CLOSE v_cursor;
END;
$$;

-- Admin: all org permissions except manage:organization (no delete/transfer)
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id, action, resource FROM public.permission_catalog WHERE scope = 'organization' LOOP
    IF NOT (v_perm.action = 'manage' AND v_perm.resource = 'organization') THEN
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES
        ('00000000-0000-0000-0000-000000000020', v_perm.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Manager: invite, approve, read members, manage team/project, read billing
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id, action, resource FROM public.permission_catalog WHERE scope = 'organization' LOOP
    IF (v_perm.action = 'invite' AND v_perm.resource = 'member')
      OR (v_perm.action = 'approve' AND v_perm.resource = 'member')
      OR (v_perm.action = 'read' AND v_perm.resource = 'member')
      OR (v_perm.action = 'manage' AND v_perm.resource = 'team')
      OR (v_perm.action = 'manage' AND v_perm.resource = 'project')
      OR (v_perm.action = 'read' AND v_perm.resource = 'billing')
      OR (v_perm.action = 'read' AND v_perm.resource = 'organization')
      OR (v_perm.action = 'manage' AND v_perm.resource = 'invite_code')
    THEN
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES
        ('00000000-0000-0000-0000-000000000030', v_perm.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Member: read member list, read org
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id, action, resource FROM public.permission_catalog WHERE scope = 'organization' LOOP
    IF (v_perm.action = 'read' AND v_perm.resource = 'member')
      OR (v_perm.action = 'read' AND v_perm.resource = 'organization')
    THEN
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES
        ('00000000-0000-0000-0000-000000000040', v_perm.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Viewer: read org only
DO $$
BEGIN
  INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT '00000000-0000-0000-0000-000000000050', id FROM public.permission_catalog
    WHERE action = 'read' AND resource = 'organization' AND scope = 'organization'
  ON CONFLICT DO NOTHING;
END;
$$;

-- Team roles
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id FROM public.permission_catalog WHERE scope = 'team' LOOP
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
      ('00000000-0000-0000-0000-000000000101', v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT '00000000-0000-0000-0000-000000000102', id FROM public.permission_catalog
    WHERE action = 'read' AND resource = 'member' AND scope = 'team'
  ON CONFLICT DO NOTHING;
END;
$$;

-- Project roles
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id FROM public.permission_catalog WHERE scope = 'project' LOOP
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
      ('00000000-0000-0000-0000-000000000201', v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  -- project_manager: all except manage:settings
  FOR v_perm IN SELECT id, action, resource FROM public.permission_catalog WHERE scope = 'project' LOOP
    IF NOT (v_perm.action = 'manage' AND v_perm.resource = 'settings') THEN
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES
        ('00000000-0000-0000-0000-000000000202', v_perm.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  -- project_member: read member
  INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT '00000000-0000-0000-0000-000000000203', id FROM public.permission_catalog
    WHERE action = 'read' AND resource = 'member' AND scope = 'project'
  ON CONFLICT DO NOTHING;
  -- project_viewer: read member
  INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT '00000000-0000-0000-0000-000000000204', id FROM public.permission_catalog
    WHERE action = 'read' AND resource = 'member' AND scope = 'project'
  ON CONFLICT DO NOTHING;
END;
$$;

-- Platform roles: all platform permissions
DO $$
DECLARE
  v_perm RECORD;
BEGIN
  FOR v_perm IN SELECT id FROM public.permission_catalog WHERE scope = 'platform' LOOP
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES
      ('00000000-0000-0000-0000-000000000001', v_perm.id),
      ('00000000-0000-0000-0000-000000000002', v_perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. SUBSCRIPTION PLANS
-- ============================================================
INSERT INTO public.subscription_plans (id, name, tier, internal_seats_included, external_seats_included, max_projects_per_org, max_teams_per_org, max_custom_roles, max_api_keys, features, audit_log_retention_days, price_monthly_cents, price_yearly_cents) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Free', 0, 3, 1, 2, 1, 0, 0, '{"proposals":false,"pipeline":false}', 7, 0, 0),
  ('00000000-0000-0000-0001-000000000002', 'Starter', 10, 10, 5, 10, 5, 2, 2, '{"proposals":true,"pipeline":true,"invoices":true}', 30, 2900, 29000),
  ('00000000-0000-0000-0001-000000000003', 'Professional', 20, 50, 25, NULL, NULL, 10, 10, '{"proposals":true,"pipeline":true,"invoices":true,"automations":true,"integrations":true,"crew":true,"equipment":true}', 90, 7900, 79000),
  ('00000000-0000-0000-0001-000000000004', 'Enterprise', 30, 250, 100, NULL, NULL, 50, 50, '{"proposals":true,"pipeline":true,"invoices":true,"automations":true,"integrations":true,"crew":true,"equipment":true,"tasks":true,"time_tracking":true,"warehouse":true,"ai_assistant":true,"sso":true}', 365, 19900, 199000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. FEATURE FLAGS
-- ============================================================
INSERT INTO public.feature_flags (key, display_name, flag_type, default_value, is_platform_controlled, min_plan_tier) VALUES
  ('invite_codes', 'Invite Codes', 'plan_gated', false, true, 10),
  ('bulk_invitations', 'Bulk Invitations', 'plan_gated', false, true, 20),
  ('qr_invite_codes', 'QR Invite Codes', 'plan_gated', false, true, 20),
  ('external_project_members', 'External Project Members', 'plan_gated', false, true, 20),
  ('custom_roles', 'Custom Roles', 'plan_gated', false, true, 20),
  ('sso_authentication', 'SSO Authentication', 'plan_gated', false, true, 30),
  ('enforce_mfa', 'Enforce MFA', 'plan_gated', false, true, 20),
  ('api_access', 'API Access', 'plan_gated', false, true, 10),
  ('advanced_audit_log', 'Advanced Audit Log', 'plan_gated', false, true, 30),
  ('domain_auto_join', 'Domain Auto-Join', 'plan_gated', false, true, 20),
  ('team_management', 'Team Management', 'plan_gated', false, true, 10),
  ('ip_allowlist', 'IP Allowlist', 'plan_gated', false, true, 30),
  ('session_management', 'Session Management', 'plan_gated', false, true, 20),
  ('impersonation', 'Platform Impersonation', 'boolean', false, true, NULL),
  ('new_onboarding_flow', 'New Onboarding Flow', 'percentage', false, false, NULL)
ON CONFLICT (key) DO NOTHING;

-- Set rollout percentage for the progressive rollout flag
UPDATE public.feature_flags SET rollout_percentage = 25 WHERE key = 'new_onboarding_flow';
