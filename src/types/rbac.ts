/**
 * RBAC — TypeScript Types
 * Identity, Authorization & Tenancy Layer
 *
 * These types mirror the database schema from migrations 00022 & 00023.
 *
 * @module types/rbac
 */

import type { InviteStatus } from '@/types/database';

// ---------------------------------------------------------------------------
// Enums & Literal Unions
// ---------------------------------------------------------------------------
export type RoleScope = 'platform' | 'organization' | 'team' | 'project' | 'all';
export type SeatType = 'internal' | 'external';
export type InvitationStatus = InviteStatus;
export type InvitationScopeType = 'organization' | 'team' | 'project';
export type AuditActorType = 'user' | 'api_key' | 'system' | 'platform_admin' | 'impersonator';
/**
 * RBAC RPC-level permission actions.
 * NOTE: This is distinct from `@/lib/permissions.ts > PermissionAction` which
 * uses 'view'/'edit' terminology for the application-layer RBAC matrix.
 * The RPC layer uses CRUD + extended actions for DB-level enforcement.
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
// ---------------------------------------------------------------------------
// System Role IDs — Two-Tier RBAC Architecture
// ---------------------------------------------------------------------------

export const SYSTEM_ROLE_IDS = {
  // Platform roles (identity layer)
  DEVELOPER:    '00000000-0000-0000-0000-000000000001',
  OWNER:        '00000000-0000-0000-0000-000000000010',
  ADMIN:        '00000000-0000-0000-0000-000000000020',
  CONTROLLER:   '00000000-0000-0000-0000-000000000025',
  COLLABORATOR: '00000000-0000-0000-0000-000000000030',
  CONTRACTOR:   '00000000-0000-0000-0000-000000000060',
  CREW:         '00000000-0000-0000-0000-000000000045',
  CLIENT:       '00000000-0000-0000-0000-000000000055',
  VIEWER:       '00000000-0000-0000-0000-000000000050',
  COMMUNITY:    '00000000-0000-0000-0000-000000000070',
  // Project roles (context layer) — canonical 12-value set per migration 00149.
  // UUID block …301..312 matches the project_role enum ordering in 00148.
  PROJECT_EXECUTIVE:  '00000000-0000-0000-0000-000000000301',
  PROJECT_PRODUCTION: '00000000-0000-0000-0000-000000000302',
  PROJECT_MANAGEMENT: '00000000-0000-0000-0000-000000000303',
  PROJECT_CREW:       '00000000-0000-0000-0000-000000000304',
  PROJECT_STAFF:      '00000000-0000-0000-0000-000000000305',
  PROJECT_TALENT:     '00000000-0000-0000-0000-000000000306',
  PROJECT_VENDOR:     '00000000-0000-0000-0000-000000000307',
  PROJECT_CLIENT:     '00000000-0000-0000-0000-000000000308',
  PROJECT_SPONSOR:    '00000000-0000-0000-0000-000000000309',
  PROJECT_PRESS:      '00000000-0000-0000-0000-000000000310',
  PROJECT_GUEST:      '00000000-0000-0000-0000-000000000311',
  PROJECT_ATTENDEE:   '00000000-0000-0000-0000-000000000312',
} as const;

/**
 * Lookup a project role UUID by its enum slug.
 * Returns undefined if the slug is not a canonical project_role value.
 */
export function getProjectRoleId(slug: string): string | undefined {
  const MAP: Record<string, string> = {
    executive:  SYSTEM_ROLE_IDS.PROJECT_EXECUTIVE,
    production: SYSTEM_ROLE_IDS.PROJECT_PRODUCTION,
    management: SYSTEM_ROLE_IDS.PROJECT_MANAGEMENT,
    crew:       SYSTEM_ROLE_IDS.PROJECT_CREW,
    staff:      SYSTEM_ROLE_IDS.PROJECT_STAFF,
    talent:     SYSTEM_ROLE_IDS.PROJECT_TALENT,
    vendor:     SYSTEM_ROLE_IDS.PROJECT_VENDOR,
    client:     SYSTEM_ROLE_IDS.PROJECT_CLIENT,
    sponsor:    SYSTEM_ROLE_IDS.PROJECT_SPONSOR,
    press:      SYSTEM_ROLE_IDS.PROJECT_PRESS,
    guest:      SYSTEM_ROLE_IDS.PROJECT_GUEST,
    attendee:   SYSTEM_ROLE_IDS.PROJECT_ATTENDEE,
  };
  return MAP[slug];
}
