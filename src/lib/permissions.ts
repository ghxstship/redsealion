/**
 * FlyteDeck — Role-Based Access Control (RBAC) Permission Matrix
 *
 * Canonical 10-role architecture:
 *   INTERNAL: developer, owner, admin, controller, manager, team_member
 *   EXTERNAL: client, contractor, crew, viewer
 *
 * This module defines the static permission matrix, helper functions,
 * and role group constants used throughout the application.
 */

import type { OrganizationRole } from '@/types/database';

// ---------------------------------------------------------------------------
// Resources & Actions
// ---------------------------------------------------------------------------

export type PermissionResource =
  | 'proposals' | 'pipeline' | 'clients' | 'invoices' | 'budgets'
  | 'reports' | 'expenses' | 'time_tracking' | 'tasks' | 'assets'
  | 'team' | 'integrations' | 'automations' | 'settings'
  | 'ai_assistant' | 'crew' | 'equipment' | 'leads' | 'warehouse'
  | 'advances' | 'activations' | 'events' | 'locations'
  | 'work_orders' | 'resources' | 'resource_scheduling'
  | 'ai_drafting' | 'email_campaigns' | 'referral_program'
  | 'purchase_orders' | 'vendors'
  | 'dispatch' | 'fabrication' | 'rentals' | 'projects' | 'goals'
  | 'portfolio' | 'compliance' | 'marketplace' | 'files'
  | 'schedule' | 'calendar' | 'campaigns' | 'templates'
  | 'terms' | 'profitability' | 'roadmap' | 'workloads'
  | 'email_inbox';

export const ALL_RESOURCES: PermissionResource[] = [
  'proposals', 'pipeline', 'clients', 'invoices', 'budgets',
  'reports', 'expenses', 'time_tracking', 'tasks', 'assets',
  'team', 'integrations', 'automations', 'settings',
  'ai_assistant', 'crew', 'equipment', 'leads', 'warehouse',
  'advances', 'activations', 'events', 'locations',
  'work_orders', 'resources', 'resource_scheduling',
  'ai_drafting', 'email_campaigns', 'referral_program',
  'purchase_orders', 'vendors',
  'dispatch', 'fabrication', 'rentals', 'projects', 'goals',
  'portfolio', 'compliance', 'marketplace', 'files',
  'schedule', 'calendar', 'campaigns', 'templates',
  'email_inbox',
  'terms', 'profitability', 'roadmap', 'workloads',
];

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';
export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

// ---------------------------------------------------------------------------
// Role groups — no legacy aliases
// ---------------------------------------------------------------------------

export const INTERNAL_ROLES: OrganizationRole[] = [
  'developer', 'owner', 'admin', 'controller', 'manager', 'team_member',
];

export const EXTERNAL_ROLES: OrganizationRole[] = [
  'client', 'contractor', 'crew', 'viewer',
];

// ---------------------------------------------------------------------------
// Role resolver — maps DB role name → OrganizationRole
//
// The roles table stores the canonical name directly. No translation needed
// for new data. This handles ONLY the roles.name values that exist in the
// Harbor Master roles table after migration 00070.
// ---------------------------------------------------------------------------

export function mapDBRoleToEnum(roleName: string): OrganizationRole {
  switch (roleName) {
    case 'developer':
    case 'developer_ops':
    case 'platform_superadmin':
    case 'platform_admin':
      return 'developer';
    case 'owner':
      return 'owner';
    case 'admin':
      return 'admin';
    case 'controller':
      return 'controller';
    case 'manager':
      return 'manager';
    case 'team_member':
      return 'team_member';
    case 'client':
      return 'client';
    case 'contractor':
      return 'contractor';
    case 'crew':
      return 'crew';
    case 'viewer':
      return 'viewer';
    default:
      return 'team_member'; // safe fallback for unknown roles
  }
}

// ---------------------------------------------------------------------------
// Permission key helper
// ---------------------------------------------------------------------------

export function permKey(resource: PermissionResource, action: PermissionAction): string {
  return `${resource}.${action}`;
}

// ---------------------------------------------------------------------------
// Matrix builders
// ---------------------------------------------------------------------------

function allActions(resources: PermissionResource[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const r of resources) for (const a of ALL_ACTIONS) m[permKey(r, a)] = true;
  return m;
}

function viewOnly(resources: PermissionResource[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const r of resources) {
    m[permKey(r, 'view')] = true;
    m[permKey(r, 'create')] = false;
    m[permKey(r, 'edit')] = false;
    m[permKey(r, 'delete')] = false;
  }
  return m;
}

function noPerm(resources: PermissionResource[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const r of resources) for (const a of ALL_ACTIONS) m[permKey(r, a)] = false;
  return m;
}

function viewCreate(resources: PermissionResource[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const r of resources) {
    m[permKey(r, 'view')] = true;
    m[permKey(r, 'create')] = true;
    m[permKey(r, 'edit')] = true;
    m[permKey(r, 'delete')] = false;
  }
  return m;
}

// ---------------------------------------------------------------------------
// DEFAULT_PERMISSIONS — canonical permission matrix
// ---------------------------------------------------------------------------

export const DEFAULT_PERMISSIONS: Record<OrganizationRole, Record<string, boolean>> = {
  // ── developer — god pass (platform operators) ──
  developer: allActions(ALL_RESOURCES),

  // ── owner — full org control ──
  owner: allActions(ALL_RESOURCES),

  // ── admin — full org management (cannot delete org or transfer ownership) ──
  admin: {
    ...allActions(ALL_RESOURCES),
    // Admin cannot delete critical org-level resources
    [permKey('settings', 'delete')]: false,
  },

  // ── controller — finance-scoped admin ──
  controller: {
    ...allActions(['invoices', 'budgets', 'expenses']),
    ...viewCreate(['reports']),
    ...viewOnly(['proposals', 'pipeline', 'clients', 'tasks', 'assets']),
    ...noPerm(['integrations', 'automations', 'settings', 'team']),
    // time tracking — view (for payroll)
    ...viewOnly(['time_tracking']),
    // ai — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — view (for payroll)
    ...viewOnly(['crew']),
    // equipment — view
    ...viewOnly(['equipment']),
    // leads — view (revenue forecasting)
    ...viewOnly(['leads']),
    // warehouse — none
    ...noPerm(['warehouse']),
    // advances — view + edit (approve POs)
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: false,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
    // activations, events, locations — view (revenue context)
    ...viewOnly(['activations', 'events', 'locations']),
    // work orders — view (dispatch oversight)
    ...viewOnly(['work_orders']),
    // resources / scheduling — view
    ...viewOnly(['resources', 'resource_scheduling']),
    // ai drafting — none
    ...noPerm(['ai_drafting']),
    // email campaigns — none (marketing-scoped)
    ...noPerm(['email_campaigns']),
    // referral program — none
    ...noPerm(['referral_program']),
    // New resources — controller view access
    ...viewOnly(['dispatch', 'fabrication', 'rentals', 'projects', 'schedule', 'calendar']),
    ...viewOnly(['portfolio', 'compliance', 'marketplace', 'files', 'goals']),
    ...viewOnly(['campaigns', 'templates', 'terms', 'roadmap', 'workloads']),
    ...allActions(['profitability']),
    ...viewOnly(['purchase_orders']),
    ...viewOnly(['vendors']),
    ...viewOnly(['email_inbox']),
  },

  // ── manager — project management (no billing, no org settings) ──
  manager: {
    ...viewCreate(['proposals', 'pipeline', 'clients', 'invoices', 'budgets', 'automations']),
    ...viewCreate(['expenses', 'time_tracking', 'tasks']),
    ...viewCreate(['reports']),
    ...viewCreate(['assets']),
    ...viewOnly(['team']),
    ...noPerm(['integrations', 'settings']),
    // ai — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — manage (no delete)
    ...viewCreate(['crew']),
    // equipment — manage (no delete)
    ...viewCreate(['equipment']),
    // leads — manage (no delete)
    ...viewCreate(['leads']),
    // warehouse — manage (no delete)
    ...viewCreate(['warehouse']),
    // advances — manage (no delete)
    ...viewCreate(['advances']),
    // activations, events, locations — manage (no delete)
    ...viewCreate(['activations', 'events', 'locations']),
    // work orders — manage (no delete)
    ...viewCreate(['work_orders']),
    // resources / scheduling — manage (no delete)
    ...viewCreate(['resources', 'resource_scheduling']),
    // ai drafting — use
    [permKey('ai_drafting', 'view')]: true,
    [permKey('ai_drafting', 'create')]: true,
    [permKey('ai_drafting', 'edit')]: false,
    [permKey('ai_drafting', 'delete')]: false,
    // email campaigns — manage (no delete)
    ...viewCreate(['email_campaigns']),
    // referral program — view only
    ...viewOnly(['referral_program']),
    // New resources — manager full operational access
    ...viewCreate(['dispatch', 'fabrication', 'rentals', 'projects', 'goals']),
    ...viewCreate(['portfolio', 'compliance', 'files', 'schedule', 'calendar']),
    ...viewCreate(['campaigns', 'templates', 'terms', 'roadmap', 'workloads']),
    ...viewOnly(['profitability', 'marketplace']),
    ...viewCreate(['purchase_orders', 'vendors']),
    ...viewCreate(['email_inbox']),
  },

  // ── team_member — standard internal (design, fabrication, general) ──
  team_member: {
    [permKey('proposals', 'view')]: true,
    [permKey('proposals', 'create')]: false,
    [permKey('proposals', 'edit')]: true,
    [permKey('proposals', 'delete')]: false,
    ...noPerm(['pipeline', 'invoices', 'budgets', 'reports', 'integrations', 'automations', 'settings']),
    [permKey('clients', 'view')]: true,
    [permKey('clients', 'create')]: false,
    [permKey('clients', 'edit')]: false,
    [permKey('clients', 'delete')]: false,
    // expenses — own
    ...viewCreate(['expenses']),
    // time tracking — own
    ...viewCreate(['time_tracking']),
    // tasks — assigned
    [permKey('tasks', 'view')]: true,
    [permKey('tasks', 'create')]: false,
    [permKey('tasks', 'edit')]: true,
    [permKey('tasks', 'delete')]: false,
    // assets — create + edit
    [permKey('assets', 'view')]: true,
    [permKey('assets', 'create')]: true,
    [permKey('assets', 'edit')]: true,
    [permKey('assets', 'delete')]: false,
    // team — view
    ...viewOnly(['team']),
    // ai — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — view
    ...viewOnly(['crew']),
    // equipment — view + edit
    [permKey('equipment', 'view')]: true,
    [permKey('equipment', 'create')]: true,
    [permKey('equipment', 'edit')]: true,
    [permKey('equipment', 'delete')]: false,
    // leads — view
    ...viewOnly(['leads']),
    // warehouse — view + edit
    [permKey('warehouse', 'view')]: true,
    [permKey('warehouse', 'create')]: true,
    [permKey('warehouse', 'edit')]: true,
    [permKey('warehouse', 'delete')]: false,
    // advances — view + create + edit
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: true,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
    // activations, events — view
    ...viewOnly(['activations', 'events']),
    // locations — view
    ...viewOnly(['locations']),
    // work orders — view (field visibility)
    ...viewOnly(['work_orders']),
    // resources / scheduling — view own
    ...viewOnly(['resources', 'resource_scheduling']),
    // ai drafting — none
    ...noPerm(['ai_drafting']),
    // email campaigns — none
    ...noPerm(['email_campaigns']),
    // referral program — none
    ...noPerm(['referral_program']),
    // New resources — team_member limited access
    ...viewOnly(['dispatch', 'fabrication', 'projects', 'schedule', 'calendar']),
    ...viewOnly(['portfolio', 'files', 'goals', 'roadmap', 'workloads']),
    ...noPerm(['rentals', 'compliance', 'marketplace', 'campaigns', 'templates', 'terms', 'profitability']),
    ...noPerm(['purchase_orders', 'vendors']),
    ...viewOnly(['email_inbox']),
  },

  // ── client — external, portal access for proposals/invoices/approvals ──
  client: noPerm(ALL_RESOURCES),

  // ── contractor — scoped external contributor ──
  contractor: noPerm(ALL_RESOURCES),

  // ── crew — external, timesheets/work orders/field ops ──
  crew: noPerm(ALL_RESOURCES),

  // ── viewer — external, read-only ──
  viewer: noPerm(ALL_RESOURCES),

  // ── fabricator — deprecated (kept in enum, maps to team_member) ──
  fabricator: noPerm(ALL_RESOURCES),
};

// ---------------------------------------------------------------------------
// Client portal permissions (separate from admin app)
// ---------------------------------------------------------------------------

export type PortalAction = 'view' | 'comment' | 'approve' | 'pay' | 'upload';

export const PORTAL_PERMISSIONS: Record<'client' | 'viewer', Record<string, boolean>> = {
  client: {
    'proposals.view': true,
    'proposals.comment': true,
    'proposals.approve': true,
    'invoices.view': true,
    'invoices.pay': true,
    'files.view': true,
    'files.upload': true,
    'milestones.view': true,
    'progress.view': true,
  },
  viewer: {
    'proposals.view': true,
    'proposals.comment': false,
    'proposals.approve': false,
    'invoices.view': true,
    'invoices.pay': false,
    'files.view': true,
    'files.upload': false,
    'milestones.view': true,
    'progress.view': true,
  },
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getDefaultPermission(
  role: OrganizationRole,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const key = permKey(resource, action);
  return DEFAULT_PERMISSIONS[role]?.[key] ?? false;
}

export function getPortalPermission(
  role: 'client' | 'viewer',
  key: string
): boolean {
  return PORTAL_PERMISSIONS[role]?.[key] ?? false;
}
