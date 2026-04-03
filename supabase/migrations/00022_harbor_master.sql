-- ============================================================
-- HARBOR MASTER: Identity, Authorization & Tenancy Layer
-- Migration 00022 — Extends existing schema with full RBAC,
-- memberships, invitations, invite codes, feature flags,
-- seat management, session tracking, and audit logging.
-- ============================================================

-- ============================================================
-- 1. EXTEND organizations TABLE
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS size_tier TEXT CHECK (size_tier IN ('solo', 'startup', 'small', 'medium', 'large', 'enterprise')),
  ADD COLUMN IF NOT EXISTS billing_email TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated', 'pending_deletion')),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS allowed_email_domains TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS require_domain_match BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_admin_approval BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invite_code_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invite_expiry_hours INTEGER NOT NULL DEFAULT 168,
  ADD COLUMN IF NOT EXISTS max_members INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- ============================================================
-- 2. EXTEND users TABLE
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated', 'pending_deletion')),
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}';

-- ============================================================
-- 3. ROLES TABLE (Hierarchical RBAC)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('platform', 'organization', 'team', 'project', 'all')),
  hierarchy_level INTEGER NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_unique_name ON public.roles(name, scope, organization_id)
  WHERE organization_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_unique_name_global ON public.roles(name, scope)
  WHERE organization_id IS NULL;

-- ============================================================
-- 4. PERMISSIONS CATALOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.permission_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL CHECK (scope IN ('platform', 'organization', 'team', 'project', 'all')),
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(action, resource, scope)
);

-- ============================================================
-- 5. ROLE_PERMISSIONS JUNCTION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_catalog(id) ON DELETE CASCADE,
  conditions JSONB NOT NULL DEFAULT '{}',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES public.users(id),
  UNIQUE(role_id, permission_id)
);

-- ============================================================
-- 6. TEAMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden', 'secret')),
  require_approval BOOLEAN NOT NULL DEFAULT false,
  invite_code_enabled BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ============================================================
-- 7. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived', 'completed')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'internal', 'private')),
  allow_external_members BOOLEAN NOT NULL DEFAULT false,
  require_admin_approval BOOLEAN NOT NULL DEFAULT true,
  invite_code_enabled BOOLEAN NOT NULL DEFAULT true,
  default_member_role_id UUID REFERENCES public.roles(id),
  max_members INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- ============================================================
-- 8. ORGANIZATION MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  seat_type TEXT NOT NULL DEFAULT 'internal' CHECK (seat_type IN ('internal', 'external')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_approval', 'dormant')),
  joined_via TEXT NOT NULL CHECK (joined_via IN ('direct_invite', 'invite_code', 'domain_match', 'manual_add', 'join_request', 'sso_auto_provision', 'api', 'org_creation')),
  invited_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES public.users(id),
  suspension_reason TEXT,
  last_active_in_org_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- ============================================================
-- 9. TEAM MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  role_id UUID NOT NULL REFERENCES public.roles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'suspended')),
  joined_via TEXT NOT NULL CHECK (joined_via IN ('direct_invite', 'invite_code', 'domain_match', 'manual_add', 'join_request', 'sso_auto_provision', 'api', 'org_creation')),
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- ============================================================
-- 10. PROJECT MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  role_id UUID NOT NULL REFERENCES public.roles(id),
  seat_type TEXT NOT NULL DEFAULT 'internal' CHECK (seat_type IN ('internal', 'external')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'suspended')),
  joined_via TEXT NOT NULL CHECK (joined_via IN ('direct_invite', 'invite_code', 'domain_match', 'manual_add', 'join_request', 'sso_auto_provision', 'api', 'org_creation')),
  invited_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  access_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- ============================================================
-- 11. INVITATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('organization', 'team', 'project')),
  scope_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  seat_type TEXT NOT NULL DEFAULT 'internal' CHECK (seat_type IN ('internal', 'external')),
  invited_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  token TEXT UNIQUE NOT NULL,
  personal_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_no_dup_pending ON public.invitations(invited_email, scope_type, scope_id) WHERE status = 'pending';

-- ============================================================
-- 12. INVITE CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('organization', 'team', 'project')),
  scope_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  seat_type TEXT NOT NULL DEFAULT 'internal' CHECK (seat_type IN ('internal', 'external')),
  created_by UUID NOT NULL REFERENCES public.users(id),
  label TEXT,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  restrict_to_domain TEXT,
  restrict_to_emails TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 13. INVITE CODE REDEMPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invite_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resulted_in_membership_id UUID,
  membership_scope TEXT NOT NULL,
  UNIQUE(invite_code_id, user_id)
);

-- ============================================================
-- 14. JOIN REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('organization', 'team', 'project')),
  scope_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  request_message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  deny_reason TEXT,
  auto_source TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_pending ON public.join_requests(user_id, scope_type, scope_id) WHERE status = 'pending';

-- ============================================================
-- 15. AUTH SETTINGS (org-level auth policy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  allowed_auth_methods TEXT[] NOT NULL DEFAULT '{email_password,magic_link}',
  require_mfa BOOLEAN NOT NULL DEFAULT false,
  mfa_grace_period_days INTEGER NOT NULL DEFAULT 7,
  password_min_length INTEGER NOT NULL DEFAULT 12,
  password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
  password_require_number BOOLEAN NOT NULL DEFAULT true,
  password_require_symbol BOOLEAN NOT NULL DEFAULT true,
  session_max_age_hours INTEGER NOT NULL DEFAULT 720,
  session_idle_timeout_minutes INTEGER NOT NULL DEFAULT 60,
  max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
  sso_provider_id TEXT,
  sso_enforce_only BOOLEAN NOT NULL DEFAULT false,
  sso_auto_provision BOOLEAN NOT NULL DEFAULT true,
  allowed_email_domains_for_signup TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 16. SESSIONS (active session tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token_hash TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  geo_country TEXT,
  geo_city TEXT,
  auth_method TEXT NOT NULL,
  mfa_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.users(id),
  revoke_reason TEXT CHECK (revoke_reason IN ('manual', 'security', 'concurrent_limit', 'idle_timeout', 'password_change', 'mfa_reset')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at) WHERE is_active = true;

-- ============================================================
-- 17. SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier INTEGER NOT NULL,
  internal_seats_included INTEGER NOT NULL,
  external_seats_included INTEGER NOT NULL,
  max_organizations INTEGER NOT NULL DEFAULT 1,
  max_projects_per_org INTEGER,
  max_teams_per_org INTEGER,
  max_custom_roles INTEGER NOT NULL DEFAULT 5,
  max_api_keys INTEGER NOT NULL DEFAULT 5,
  max_invite_codes_per_month INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  audit_log_retention_days INTEGER NOT NULL DEFAULT 90,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 18. SEAT ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seat_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  internal_seats_included INTEGER NOT NULL,
  internal_seats_purchased INTEGER NOT NULL DEFAULT 0,
  internal_seats_used INTEGER NOT NULL DEFAULT 0,
  external_seats_included INTEGER NOT NULL,
  external_seats_purchased INTEGER NOT NULL DEFAULT 0,
  external_seats_used INTEGER NOT NULL DEFAULT 0,
  overage_allowed BOOLEAN NOT NULL DEFAULT false,
  overage_rate_internal_cents INTEGER,
  overage_rate_external_cents INTEGER,
  last_reconciled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 19. FEATURE FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('boolean', 'percentage', 'allowlist', 'plan_gated')),
  default_value BOOLEAN NOT NULL DEFAULT false,
  is_platform_controlled BOOLEAN NOT NULL DEFAULT true,
  min_plan_tier INTEGER,
  rollout_percentage INTEGER CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. FEATURE FLAG OVERRIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_flag_id UUID NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  reason TEXT,
  set_by UUID NOT NULL REFERENCES public.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (organization_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ff_override_org ON public.feature_flag_overrides(feature_flag_id, organization_id) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ff_override_user ON public.feature_flag_overrides(feature_flag_id, user_id) WHERE organization_id IS NULL;

-- ============================================================
-- 21. EXTEND AUDIT_LOG with Harbor Master fields
-- ============================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'api_key', 'system', 'platform_admin', 'impersonator')),
  ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS resource_type TEXT,
  ADD COLUMN IF NOT EXISTS changes JSONB NOT NULL DEFAULT '{}';

-- ============================================================
-- 22. EXTEND API_KEYS with Harbor Master fields
-- ============================================================
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_used_ip INET,
  ADD COLUMN IF NOT EXISTS rate_limit_rpm INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS allowed_ips INET[] NOT NULL DEFAULT '{}';

-- ============================================================
-- 23. ADD default_member_role_id TO organizations
-- ============================================================
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS default_member_role_id UUID REFERENCES public.roles(id);

-- ============================================================
-- 24. ENABLE RLS ON ALL NEW TABLES
-- ============================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 25. CHECK_PERMISSION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_permission(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_scope TEXT,
  p_scope_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role_id UUID;
  v_perm_id UUID;
  v_conditions JSONB;
BEGIN
  -- Platform scope: check if user is platform admin
  IF p_scope = 'platform' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.roles r
      JOIN public.organization_memberships om ON om.role_id = r.id
      WHERE om.user_id = p_user_id
        AND om.status = 'active'
        AND r.scope = 'platform'
        AND r.hierarchy_level <= 1
    );
  END IF;

  -- Organization scope
  IF p_scope = 'organization' THEN
    SELECT om.role_id INTO v_role_id
    FROM public.organization_memberships om
    WHERE om.user_id = p_user_id
      AND om.organization_id = p_scope_id
      AND om.status = 'active';
  END IF;

  -- Team scope
  IF p_scope = 'team' THEN
    SELECT tm.role_id INTO v_role_id
    FROM public.team_memberships tm
    WHERE tm.user_id = p_user_id
      AND tm.team_id = p_scope_id
      AND tm.status = 'active';
  END IF;

  -- Project scope
  IF p_scope = 'project' THEN
    SELECT pm.role_id INTO v_role_id
    FROM public.project_memberships pm
    WHERE pm.user_id = p_user_id
      AND pm.project_id = p_scope_id
      AND pm.status = 'active';
  END IF;

  -- No membership found
  IF v_role_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check role_permissions for matching permission
  SELECT pc.id, rp.conditions INTO v_perm_id, v_conditions
  FROM public.role_permissions rp
  JOIN public.permission_catalog pc ON pc.id = rp.permission_id
  WHERE rp.role_id = v_role_id
    AND pc.action = p_action
    AND pc.resource = p_resource
    AND (pc.scope = p_scope OR pc.scope = 'all');

  IF v_perm_id IS NOT NULL THEN
    -- Evaluate conditions if present
    IF v_conditions IS NOT NULL AND v_conditions != '{}' THEN
      -- max_hierarchy_level: target role must be >= this level
      IF v_conditions ? 'max_hierarchy_level' THEN
        RETURN TRUE; -- Condition evaluated at app layer
      END IF;
      -- own_resources_only evaluated at app layer
      RETURN TRUE;
    END IF;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 26. EVALUATE_FEATURE_FLAG FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.evaluate_feature_flag(
  p_key TEXT,
  p_org_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_flag RECORD;
  v_override_enabled BOOLEAN;
  v_plan_tier INTEGER;
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_key;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- 1. User override (highest priority)
  IF p_user_id IS NOT NULL THEN
    SELECT enabled INTO v_override_enabled
    FROM public.feature_flag_overrides
    WHERE feature_flag_id = v_flag.id
      AND user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > now());
    IF FOUND THEN RETURN v_override_enabled; END IF;
  END IF;

  -- 2. Org override
  IF p_org_id IS NOT NULL THEN
    SELECT enabled INTO v_override_enabled
    FROM public.feature_flag_overrides
    WHERE feature_flag_id = v_flag.id
      AND organization_id = p_org_id
      AND user_id IS NULL
      AND (expires_at IS NULL OR expires_at > now());
    IF FOUND THEN RETURN v_override_enabled; END IF;
  END IF;

  -- 3. By type
  IF v_flag.flag_type = 'boolean' THEN
    RETURN v_flag.default_value;
  END IF;

  IF v_flag.flag_type = 'plan_gated' AND p_org_id IS NOT NULL THEN
    SELECT sp.tier INTO v_plan_tier
    FROM public.seat_allocations sa
    JOIN public.subscription_plans sp ON sp.id = sa.plan_id
    WHERE sa.organization_id = p_org_id;
    IF FOUND AND v_plan_tier >= COALESCE(v_flag.min_plan_tier, 0) THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  IF v_flag.flag_type = 'percentage' AND p_org_id IS NOT NULL THEN
    RETURN (abs(hashtext(p_org_id::text || v_flag.id::text)) % 100) < COALESCE(v_flag.rollout_percentage, 0);
  END IF;

  RETURN v_flag.default_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 27. RLS POLICIES FOR NEW TABLES
-- ============================================================

-- Roles: everyone can read system + own org, admins manage custom
CREATE POLICY "roles_select" ON public.roles FOR SELECT USING (
  organization_id IS NULL
  OR organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "roles_insert" ON public.roles FOR INSERT WITH CHECK (
  organization_id IS NOT NULL
  AND check_permission(auth.uid(), 'manage', 'role', 'organization', organization_id)
);
CREATE POLICY "roles_update" ON public.roles FOR UPDATE USING (
  is_system = false
  AND organization_id IS NOT NULL
  AND check_permission(auth.uid(), 'manage', 'role', 'organization', organization_id)
);
CREATE POLICY "roles_delete" ON public.roles FOR DELETE USING (
  is_system = false
  AND organization_id IS NOT NULL
  AND check_permission(auth.uid(), 'manage', 'role', 'organization', organization_id)
);

-- Permission catalog: readable by all authenticated
CREATE POLICY "perm_catalog_select" ON public.permission_catalog FOR SELECT USING (true);

-- Role permissions: readable by all authenticated
CREATE POLICY "role_perms_select" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "role_perms_manage" ON public.role_permissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = role_id
    AND r.organization_id IS NOT NULL
    AND check_permission(auth.uid(), 'manage', 'role', 'organization', r.organization_id)
  )
);

-- Teams: org members can see visible/hidden, secret only for team members
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
  AND (
    visibility != 'secret'
    OR EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = id AND tm.user_id = auth.uid() AND tm.status = 'active'
    )
  )
);
CREATE POLICY "teams_manage" ON public.teams FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'team', 'organization', organization_id)
);

-- Projects: based on visibility and membership
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
  visibility = 'public'
  OR (
    visibility = 'internal'
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_memberships om
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  )
  OR EXISTS (
    SELECT 1 FROM public.project_memberships pm
    WHERE pm.project_id = id AND pm.user_id = auth.uid() AND pm.status = 'active'
  )
);
CREATE POLICY "projects_manage" ON public.projects FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'project', 'organization', organization_id)
);

-- Organization memberships
CREATE POLICY "org_mem_select_own" ON public.organization_memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "org_mem_select_peers" ON public.organization_memberships FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "org_mem_insert" ON public.organization_memberships FOR INSERT WITH CHECK (
  check_permission(auth.uid(), 'manage', 'member', 'organization', organization_id)
  OR check_permission(auth.uid(), 'invite', 'member', 'organization', organization_id)
);
CREATE POLICY "org_mem_update" ON public.organization_memberships FOR UPDATE USING (
  check_permission(auth.uid(), 'manage', 'member', 'organization', organization_id)
);
CREATE POLICY "org_mem_delete" ON public.organization_memberships FOR DELETE USING (
  check_permission(auth.uid(), 'manage', 'member', 'organization', organization_id)
  AND user_id != auth.uid()
);

-- Team memberships
CREATE POLICY "team_mem_select" ON public.team_memberships FOR SELECT USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "team_mem_manage" ON public.team_memberships FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'member', 'team', team_id)
  OR check_permission(auth.uid(), 'manage', 'member', 'organization', organization_id)
);

-- Project memberships
CREATE POLICY "proj_mem_select" ON public.project_memberships FOR SELECT USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "proj_mem_manage" ON public.project_memberships FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'member', 'project', project_id)
  OR check_permission(auth.uid(), 'manage', 'member', 'organization', organization_id)
);

-- Invitations
CREATE POLICY "inv_select_sent" ON public.invitations FOR SELECT USING (invited_by = auth.uid());
CREATE POLICY "inv_select_received" ON public.invitations FOR SELECT USING (
  invited_email = (SELECT email FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "inv_select_approver" ON public.invitations FOR SELECT USING (
  check_permission(auth.uid(), 'approve', 'member', 'organization', organization_id)
);
CREATE POLICY "inv_insert" ON public.invitations FOR INSERT WITH CHECK (
  check_permission(auth.uid(), 'invite', 'member', scope_type, scope_id)
);
CREATE POLICY "inv_update_recipient" ON public.invitations FOR UPDATE USING (
  invited_email = (SELECT email FROM public.users WHERE id = auth.uid()) AND status = 'pending'
);
CREATE POLICY "inv_update_revoker" ON public.invitations FOR UPDATE USING (
  invited_by = auth.uid()
  OR check_permission(auth.uid(), 'approve', 'member', 'organization', organization_id)
);

-- Invite codes
CREATE POLICY "ic_select_own" ON public.invite_codes FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "ic_select_admin" ON public.invite_codes FOR SELECT USING (
  check_permission(auth.uid(), 'manage', 'invite_code', 'organization', organization_id)
);
CREATE POLICY "ic_insert" ON public.invite_codes FOR INSERT WITH CHECK (
  check_permission(auth.uid(), 'manage', 'invite_code', 'organization', organization_id)
);
CREATE POLICY "ic_update" ON public.invite_codes FOR UPDATE USING (
  created_by = auth.uid()
  OR check_permission(auth.uid(), 'manage', 'invite_code', 'organization', organization_id)
);

-- Invite code redemptions (system-managed)
CREATE POLICY "icr_select_own" ON public.invite_code_redemptions FOR SELECT USING (user_id = auth.uid());

-- Join requests
CREATE POLICY "jr_select_own" ON public.join_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "jr_select_approver" ON public.join_requests FOR SELECT USING (
  check_permission(auth.uid(), 'approve', 'member', scope_type, scope_id)
);
CREATE POLICY "jr_insert" ON public.join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "jr_update_approver" ON public.join_requests FOR UPDATE USING (
  check_permission(auth.uid(), 'approve', 'member', scope_type, scope_id)
);
CREATE POLICY "jr_update_withdraw" ON public.join_requests FOR UPDATE USING (
  user_id = auth.uid() AND status = 'pending'
);

-- Auth settings
CREATE POLICY "auth_settings_select" ON public.auth_settings FOR SELECT USING (
  check_permission(auth.uid(), 'manage', 'settings', 'organization', organization_id)
);
CREATE POLICY "auth_settings_manage" ON public.auth_settings FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'settings', 'organization', organization_id)
);

-- Sessions
CREATE POLICY "sessions_select_own" ON public.sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sessions_select_admin" ON public.sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.sessions s ON s.user_id = om.user_id
    WHERE om.organization_id IN (
      SELECT om2.organization_id FROM public.organization_memberships om2
      WHERE om2.user_id = auth.uid() AND om2.status = 'active'
    )
  )
  AND check_permission(auth.uid(), 'manage', 'session', 'organization',
    (SELECT om.organization_id FROM public.organization_memberships om WHERE om.user_id = public.sessions.user_id LIMIT 1))
);

-- Subscription plans (readable by all)
CREATE POLICY "plans_select" ON public.subscription_plans FOR SELECT USING (true);

-- Seat allocations
CREATE POLICY "seats_select" ON public.seat_allocations FOR SELECT USING (
  organization_id IN (
    SELECT om.organization_id FROM public.organization_memberships om
    WHERE om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "seats_manage" ON public.seat_allocations FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'billing', 'organization', organization_id)
);

-- Feature flags (readable by all authenticated)
CREATE POLICY "ff_select" ON public.feature_flags FOR SELECT USING (true);

-- Feature flag overrides
CREATE POLICY "ffo_platform_admin" ON public.feature_flag_overrides FOR ALL USING (
  check_permission(auth.uid(), 'manage', 'feature_flag', 'platform', NULL)
);
CREATE POLICY "ffo_org_admin_select" ON public.feature_flag_overrides FOR SELECT USING (
  organization_id IS NOT NULL
  AND check_permission(auth.uid(), 'manage', 'feature_flag', 'organization', organization_id)
  AND EXISTS (
    SELECT 1 FROM public.feature_flags ff
    WHERE ff.id = feature_flag_id AND ff.is_platform_controlled = false
  )
);

-- ============================================================
-- 28. UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'roles', 'teams', 'projects',
      'organization_memberships', 'team_memberships', 'project_memberships',
      'invite_codes', 'auth_settings', 'seat_allocations',
      'feature_flags', 'feature_flag_overrides'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
