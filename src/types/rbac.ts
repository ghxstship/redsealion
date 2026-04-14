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
  // Project roles (context layer)
  PROJECT_CREATOR:      '00000000-0000-0000-0000-000000000201',
  PROJECT_COLLABORATOR: '00000000-0000-0000-0000-000000000203',
  PROJECT_VIEWER:       '00000000-0000-0000-0000-000000000204',
  PROJECT_VENDOR:       '00000000-0000-0000-0000-000000000205',
} as const;
