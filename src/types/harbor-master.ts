/**
 * Harbor Master — TypeScript Types
 * Identity, Authorization & Tenancy Layer
 *
 * These types mirror the database schema from migrations 00022 & 00023.
 */

import type { InviteStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Enums & Literal Unions
// ---------------------------------------------------------------------------

export type UserStatus = 'active' | 'suspended' | 'deactivated' | 'pending_deletion';
export type OrgStatus = 'active' | 'suspended' | 'deactivated' | 'pending_deletion';
export type RoleScope = 'platform' | 'organization' | 'team' | 'project' | 'all';
export type SeatType = 'internal' | 'external';
export type OrgMembershipStatus = 'active' | 'suspended' | 'pending_approval' | 'dormant';
export type TeamProjectMembershipStatus = 'active' | 'pending_approval' | 'suspended';
export type JoinedVia = 'direct_invite' | 'invite_code' | 'domain_match' | 'manual_add' | 'join_request' | 'sso_auto_provision' | 'api' | 'org_creation';
export type InvitationStatus = InviteStatus;
export type InvitationScopeType = 'organization' | 'team' | 'project';
export type JoinRequestStatus = 'pending' | 'approved' | 'denied' | 'withdrawn';
export type FeatureFlagType = 'boolean' | 'percentage' | 'allowlist' | 'plan_gated';
export type SessionRevokeReason = 'manual' | 'security' | 'concurrent_limit' | 'idle_timeout' | 'password_change' | 'mfa_reset';
export type AuditActorType = 'user' | 'api_key' | 'system' | 'platform_admin' | 'impersonator';
export type TeamVisibility = 'visible' | 'hidden' | 'secret';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'archived' | 'completed';
export type ProjectVisibility = 'public' | 'internal' | 'private';
export type OrgSizeTier = 'solo' | 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

/**
 * Harbor Master RPC-level permission actions.
 * NOTE: This is distinct from `@/lib/permissions.ts > PermissionAction` which
 * uses 'view'/'edit' terminology for the application-layer RBAC matrix.
 * Harbor Master uses CRUD + extended actions for DB-level enforcement.
 */
export type PermissionAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'manage' | 'invite' | 'approve' | 'export'
  | 'configure' | 'bulk_invite' | 'impersonate';

export type PermissionResource =
  | 'organization' | 'project' | 'team' | 'member'
  | 'role' | 'invitation' | 'invite_code' | 'billing'
  | 'api_key' | 'feature_flag' | 'audit_log' | 'settings'
  | 'session' | 'user';

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  scope: RoleScope;
  hierarchy_level: number;
  is_system: boolean;
  is_default: boolean;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissionCatalogEntry {
  id: string;
  action: PermissionAction;
  resource: PermissionResource;
  description: string | null;
  scope: RoleScope;
  is_sensitive: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  conditions: Record<string, unknown>;
  granted_at: string;
  granted_by: string | null;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  visibility: TeamVisibility;
  require_approval: boolean;
  invite_code_enabled: boolean;
  max_members: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  allow_external_members: boolean;
  require_admin_approval: boolean;
  invite_code_enabled: boolean;
  default_member_role_id: string | null;
  max_members: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  seat_type: SeatType;
  status: OrgMembershipStatus;
  joined_via: JoinedVia;
  invited_by: string | null;
  approved_by: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  last_active_in_org_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  id: string;
  user_id: string;
  team_id: string;
  organization_id: string;
  role_id: string;
  status: TeamProjectMembershipStatus;
  joined_via: JoinedVia;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMembership {
  id: string;
  user_id: string;
  project_id: string;
  organization_id: string;
  role_id: string;
  seat_type: SeatType;
  status: TeamProjectMembershipStatus;
  joined_via: JoinedVia;
  invited_by: string | null;
  approved_by: string | null;
  access_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  scope_type: InvitationScopeType;
  scope_id: string;
  invited_email: string;
  role_id: string;
  seat_type: SeatType;
  invited_by: string;
  status: InvitationStatus;
  token: string;
  personal_message: string | null;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  organization_id: string;
  scope_type: InvitationScopeType;
  scope_id: string;
  role_id: string;
  seat_type: SeatType;
  created_by: string;
  label: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  requires_approval: boolean;
  restrict_to_domain: string | null;
  restrict_to_emails: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeRedemption {
  id: string;
  invite_code_id: string;
  user_id: string;
  redeemed_at: string;
  resulted_in_membership_id: string | null;
  membership_scope: string;
}

export interface JoinRequest {
  id: string;
  user_id: string;
  organization_id: string;
  scope_type: InvitationScopeType;
  scope_id: string;
  status: JoinRequestStatus;
  request_message: string | null;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  deny_reason: string | null;
  auto_source: string | null;
}

export interface AuthSettings {
  id: string;
  organization_id: string;
  allowed_auth_methods: string[];
  require_mfa: boolean;
  mfa_grace_period_days: number;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_number: boolean;
  password_require_symbol: boolean;
  session_max_age_hours: number;
  session_idle_timeout_minutes: number;
  max_concurrent_sessions: number;
  sso_provider_id: string | null;
  sso_enforce_only: boolean;
  sso_auto_provision: boolean;
  allowed_email_domains_for_signup: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  session_token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  geo_country: string | null;
  geo_city: string | null;
  auth_method: string;
  mfa_verified: boolean;
  is_active: boolean;
  last_active_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: SessionRevokeReason | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: number;
  internal_seats_included: number;
  external_seats_included: number;
  max_organizations: number;
  max_projects_per_org: number | null;
  max_teams_per_org: number | null;
  max_custom_roles: number;
  max_api_keys: number;
  max_invite_codes_per_month: number | null;
  features: Record<string, boolean>;
  audit_log_retention_days: number;
  price_monthly_cents: number;
  price_yearly_cents: number;
  is_active: boolean;
  created_at: string;
}

export interface SeatAllocation {
  id: string;
  organization_id: string;
  plan_id: string;
  internal_seats_included: number;
  internal_seats_purchased: number;
  internal_seats_used: number;
  external_seats_included: number;
  external_seats_purchased: number;
  external_seats_used: number;
  overage_allowed: boolean;
  overage_rate_internal_cents: number | null;
  overage_rate_external_cents: number | null;
  last_reconciled_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  flag_type: FeatureFlagType;
  default_value: boolean;
  is_platform_controlled: boolean;
  min_plan_tier: number | null;
  rollout_percentage: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagOverride {
  id: string;
  feature_flag_id: string;
  organization_id: string | null;
  user_id: string | null;
  enabled: boolean;
  reason: string | null;
  set_by: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string | null;
  actor_id: string | null;
  actor_type: AuditActorType;
  impersonated_by: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// System Role IDs (from seed data)
// ---------------------------------------------------------------------------

export const SYSTEM_ROLE_IDS = {
  PLATFORM_SUPERADMIN: '00000000-0000-0000-0000-000000000001',
  PLATFORM_ADMIN: '00000000-0000-0000-0000-000000000002',
  OWNER: '00000000-0000-0000-0000-000000000010',
  ADMIN: '00000000-0000-0000-0000-000000000020',
  MANAGER: '00000000-0000-0000-0000-000000000030',
  MEMBER: '00000000-0000-0000-0000-000000000040',
  VIEWER: '00000000-0000-0000-0000-000000000050',
  GUEST: '00000000-0000-0000-0000-000000000060',
  TEAM_LEAD: '00000000-0000-0000-0000-000000000101',
  TEAM_MEMBER: '00000000-0000-0000-0000-000000000102',
  PROJECT_ADMIN: '00000000-0000-0000-0000-000000000201',
  PROJECT_MANAGER: '00000000-0000-0000-0000-000000000202',
  PROJECT_MEMBER: '00000000-0000-0000-0000-000000000203',
  PROJECT_VIEWER: '00000000-0000-0000-0000-000000000204',
  PROJECT_GUEST: '00000000-0000-0000-0000-000000000205',
} as const;

export const SYSTEM_PLAN_IDS = {
  FREE: '00000000-0000-0000-0001-000000000001',
  STARTER: '00000000-0000-0000-0001-000000000002',
  PROFESSIONAL: '00000000-0000-0000-0001-000000000003',
  ENTERPRISE: '00000000-0000-0000-0001-000000000004',
} as const;
