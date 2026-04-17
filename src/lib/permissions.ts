/**
 * FlyteDeck — Role-Based Access Control (RBAC) Permission Matrix
 *
 * Two-Tier Architecture:
 *   PLATFORM (org_role): developer, owner, admin, controller, collaborator,
 *                        contractor, crew, client, community
 *   PROJECT  (project_role): executive, production, management, crew, staff, talent, vendor, client, sponsor, press, guest, attendee
 *
 * This module defines the static permission matrix, helper functions,
 * and role group constants used throughout the application.
 */

/**
 * Platform role type — directly mirrors the `org_role` Postgres enum.
 * This is the SSOT for all platform-level role checks.
 */
export type PlatformRole =
  | 'developer' | 'owner' | 'admin' | 'controller' | 'collaborator'
  | 'contractor' | 'crew' | 'client' | 'viewer' | 'community';

/**
 * Project role type — directly mirrors the `project_role` Postgres enum.
 */
export type ProjectRole = 'executive' | 'production' | 'management' | 'crew' | 'staff' | 'talent' | 'vendor' | 'client' | 'sponsor' | 'press' | 'guest' | 'attendee';

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
  | 'project_portals' | 'webhooks' | 'schedule' | 'portals'
  | 'profitability' | 'templates' | 'terms' | 'workloads'
  | 'roadmap' | 'finance' | 'calendar' | 'campaigns'
  | 'email_inbox' | 'recruitment'
  | 'spaces' | 'zones' | 'components' | 'component_items'
  | 'hierarchy_tasks' | 'manifest';

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
  'project_portals', 'webhooks', 'schedule', 'portals',
  'profitability', 'templates', 'terms', 'workloads',
  'roadmap', 'finance', 'calendar', 'campaigns',
  'email_inbox', 'recruitment',
  'spaces', 'zones', 'components', 'component_items',
  'hierarchy_tasks', 'manifest',
];

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';
export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

// ---------------------------------------------------------------------------
// Role groups — Two-Tier Architecture
// ---------------------------------------------------------------------------

export const INTERNAL_ROLES: PlatformRole[] = [
  'developer', 'owner', 'admin', 'controller', 'collaborator',
];

export const EXTERNAL_ROLES: PlatformRole[] = [
  'client', 'contractor', 'crew', 'viewer',
];

const PUBLIC_ROLES: PlatformRole[] = [
  'community',
];



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
// DEFAULT_PERMISSIONS — Two-Tier Platform Permission Matrix
// ---------------------------------------------------------------------------

export const DEFAULT_PERMISSIONS: Record<PlatformRole, Record<string, boolean>> = {
  // ── developer — god pass (platform operators) ──
  developer: allActions(ALL_RESOURCES),

  // ── owner — full org control ──
  owner: allActions(ALL_RESOURCES),

  // ── admin — full org management (cannot delete org or transfer ownership) ──
  admin: {
    ...allActions(ALL_RESOURCES),
    [permKey('settings', 'delete')]: false,
  },

  // ── controller — finance-scoped admin ──
  controller: {
    ...allActions(['invoices', 'budgets', 'expenses']),
    ...viewCreate(['reports']),
    ...viewOnly(['proposals', 'pipeline', 'clients', 'tasks', 'assets']),
    ...noPerm(['integrations', 'automations', 'settings', 'team']),
    ...viewOnly(['time_tracking']),
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    ...viewOnly(['crew']),
    ...viewOnly(['equipment']),
    ...viewOnly(['leads']),
    ...noPerm(['warehouse']),
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: false,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
    ...viewOnly(['activations', 'events', 'locations']),
    ...viewOnly(['work_orders']),
    ...viewOnly(['resources', 'resource_scheduling']),
    ...noPerm(['ai_drafting']),
    ...noPerm(['email_campaigns']),
    ...noPerm(['referral_program']),
    ...viewOnly(['dispatch', 'fabrication', 'rentals', 'projects', 'schedule', 'calendar']),
    ...viewOnly(['portfolio', 'compliance', 'marketplace', 'files', 'goals']),
    ...viewOnly(['campaigns', 'templates', 'terms', 'roadmap', 'workloads']),
    ...allActions(['profitability']),
    ...viewOnly(['purchase_orders']),
    ...viewOnly(['vendors']),
    ...viewOnly(['email_inbox']),
    ...viewOnly(['portals', 'project_portals']),
    ...noPerm(['webhooks']),
    ...viewOnly(['finance']),
    // Hierarchy resources — explicit view-only (closes permission gap)
    ...viewOnly(['spaces', 'zones', 'components', 'component_items', 'hierarchy_tasks', 'manifest']),
    // Recruitment — view only
    ...viewOnly(['recruitment']),
  },

  // ── collaborator — standard internal ──
  collaborator: {
    // Proposals: view + edit (no create/delete — managed by project creators)
    [permKey('proposals', 'view')]: true,
    [permKey('proposals', 'create')]: true,
    [permKey('proposals', 'edit')]: true,
    [permKey('proposals', 'delete')]: false,
    // Pipeline & clients
    ...viewCreate(['pipeline', 'clients']),
    // Finance: view invoices/budgets (no create/edit — controller domain)
    ...viewOnly(['invoices', 'budgets']),
    ...viewCreate(['reports']),
    // Expenses & time — own entries
    ...viewCreate(['expenses', 'time_tracking']),
    // Tasks — assigned
    [permKey('tasks', 'view')]: true,
    [permKey('tasks', 'create')]: true,
    [permKey('tasks', 'edit')]: true,
    [permKey('tasks', 'delete')]: false,
    // Assets — create + edit
    [permKey('assets', 'view')]: true,
    [permKey('assets', 'create')]: true,
    [permKey('assets', 'edit')]: true,
    [permKey('assets', 'delete')]: false,
    // Team — view
    ...viewOnly(['team']),
    // No integrations/automations/settings access
    ...noPerm(['integrations', 'settings']),
    ...viewCreate(['automations']),
    // AI — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // Crew — manage (no delete)
    ...viewCreate(['crew']),
    // Equipment — manage (no delete)
    ...viewCreate(['equipment']),
    // Leads — manage (no delete)
    ...viewCreate(['leads']),
    // Warehouse — manage (no delete)
    ...viewCreate(['warehouse']),
    // Advances — manage (no delete)
    ...viewCreate(['advances']),
    // Events, activations, locations — manage (no delete)
    ...viewCreate(['activations', 'events', 'locations']),
    // Work orders — manage (no delete)
    ...viewCreate(['work_orders']),
    // Resources / scheduling — manage (no delete)
    ...viewCreate(['resources', 'resource_scheduling']),
    // AI drafting — use
    [permKey('ai_drafting', 'view')]: true,
    [permKey('ai_drafting', 'create')]: true,
    [permKey('ai_drafting', 'edit')]: false,
    [permKey('ai_drafting', 'delete')]: false,
    // Email campaigns — manage (no delete)
    ...viewCreate(['email_campaigns']),
    // Referral program — view only
    ...viewOnly(['referral_program']),
    // New resources — full operational access
    ...viewCreate(['dispatch', 'fabrication', 'rentals', 'projects', 'goals']),
    ...viewCreate(['portfolio', 'compliance', 'files', 'schedule', 'calendar']),
    ...viewCreate(['campaigns', 'templates', 'terms', 'roadmap', 'workloads']),
    ...viewOnly(['profitability', 'marketplace']),
    ...viewCreate(['purchase_orders', 'vendors']),
    ...viewCreate(['email_inbox']),
    // Portals / project_portals — manage (no delete)
    ...viewCreate(['portals', 'project_portals']),
    // Webhooks — view only
    ...viewOnly(['webhooks']),
    // Finance — view only
    ...viewOnly(['finance']),
    // Hierarchy resources — operational access (closes permission gap)
    ...viewCreate(['spaces', 'zones', 'components', 'component_items', 'hierarchy_tasks', 'manifest']),
    // Recruitment — manage (no delete)
    ...viewCreate(['recruitment']),
  },


  // ── contractor — scoped external contributor (portal access) ──
  contractor: noPerm(ALL_RESOURCES),

  // ── crew — external field ops (portal access) ──
  crew: noPerm(ALL_RESOURCES),

  // ── client — external customer (portal access) ──
  client: noPerm(ALL_RESOURCES),

  // ── viewer — authenticated read-only (investors, auditors, board members) ──
  viewer: {
    ...noPerm(ALL_RESOURCES),
    ...viewOnly(['proposals', 'reports', 'portfolio', 'budgets', 'roadmap',
                  'projects', 'goals', 'profitability',
                  'spaces', 'zones', 'components', 'component_items']),
  },

  // ── community — unauthenticated public (no permissions) ──
  community: noPerm(ALL_RESOURCES),
};

// ---------------------------------------------------------------------------
// Client portal permissions (separate from admin app)
// ---------------------------------------------------------------------------
const PORTAL_PERMISSIONS: Record<'client' | 'viewer' | 'community', Record<string, boolean>> = {
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
    'reports.view': true,
    'portfolio.view': true,
    'budgets.view': true,
    'roadmap.view': true,
  },
  community: {
    'proposals.view': true,
    'proposals.comment': false,
    'proposals.approve': false,
    'invoices.view': false,
    'invoices.pay': false,
    'files.view': true,
    'files.upload': false,
    'milestones.view': true,
    'progress.view': true,
  },
};

// ---------------------------------------------------------------------------
// Contractor portal permissions (for crew / contractor external roles)
// ---------------------------------------------------------------------------

const CONTRACTOR_PORTAL_PERMISSIONS: Record<'contractor' | 'crew', Record<string, boolean>> = {
  contractor: {
    'work_orders.view': true,
    'work_orders.bid': true,
    'bookings.view': true,
    'bookings.respond': true,
    'time_entries.view': true,
    'time_entries.create': true,
    'compliance.view': true,
    'compliance.upload': true,
    'profile.view': true,
    'profile.edit': true,
    'documents.view': true,
    'documents.upload': true,
    'earnings.view': true,
  },
  crew: {
    'work_orders.view': false,
    'work_orders.bid': false,
    'bookings.view': true,
    'bookings.respond': true,
    'time_entries.view': true,
    'time_entries.create': true,
    'compliance.view': true,
    'compliance.upload': true,
    'profile.view': true,
    'profile.edit': true,
    'documents.view': true,
    'documents.upload': true,
    'earnings.view': true,
  },
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getDefaultPermission(
  role: PlatformRole,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const key = permKey(resource, action);
  return DEFAULT_PERMISSIONS[role]?.[key] ?? false;
}

// ---------------------------------------------------------------------------
// DEFAULT_PROJECT_PERMISSIONS — 12-value canonical project-role matrix
//
// Mirrors the DB SSOT in role_permission_bundles (migration 00149).
// RPC-vocabulary actions (create/read/update/delete/manage/invite/approve/export)
// are mapped through projectActionToAppAction() for the app-layer checker.
// ---------------------------------------------------------------------------

type ProjectAction =
  | 'create' | 'read' | 'update' | 'delete'
  | 'manage' | 'invite' | 'approve' | 'export' | 'configure';

export type ProjectPermissionKey = `${PermissionResource}.${ProjectAction}`;

function pk(resource: PermissionResource, action: ProjectAction): ProjectPermissionKey {
  return `${resource}.${action}` as ProjectPermissionKey;
}

export const DEFAULT_PROJECT_PERMISSIONS: Record<ProjectRole, Record<string, boolean>> = {
  executive: {
    [pk('projects','create')]: true, [pk('projects','read')]: true, [pk('projects','update')]: true, [pk('projects','delete')]: true, [pk('projects','manage')]: true, [pk('projects','approve')]: true,
    [pk('advances','read')]: true, [pk('advances','update')]: true, [pk('advances','approve')]: true,
    [pk('purchase_orders','read')]: true, [pk('purchase_orders','approve')]: true,
    [pk('invoices','read')]: true, [pk('invoices','approve')]: true,
    [pk('budgets','read')]: true, [pk('budgets','update')]: true, [pk('budgets','approve')]: true,
    [pk('settings','read')]: true, [pk('settings','update')]: true,
    [pk('reports','read')]: true, [pk('reports','export')]: true,
    [pk('finance','read')]: true, [pk('finance','approve')]: true,
    [pk('compliance','read')]: true, [pk('compliance','approve')]: true,
    [pk('crew','read')]: true, [pk('crew','manage')]: true,
    [pk('vendors','read')]: true, [pk('vendors','manage')]: true,
    [pk('clients','read')]: true, [pk('clients','manage')]: true,
    [pk('events','read')]: true, [pk('events','manage')]: true,
    [pk('activations','read')]: true, [pk('activations','manage')]: true,
  },
  production: {
    [pk('projects','read')]: true, [pk('projects','update')]: true,
    [pk('events','create')]: true, [pk('events','read')]: true, [pk('events','update')]: true, [pk('events','manage')]: true,
    [pk('activations','create')]: true, [pk('activations','read')]: true, [pk('activations','update')]: true,
    [pk('advances','create')]: true, [pk('advances','read')]: true, [pk('advances','update')]: true, [pk('advances','approve')]: true,
    [pk('crew','create')]: true, [pk('crew','read')]: true, [pk('crew','update')]: true, [pk('crew','invite')]: true,
    [pk('schedule','create')]: true, [pk('schedule','read')]: true, [pk('schedule','update')]: true,
    [pk('tasks','create')]: true, [pk('tasks','read')]: true, [pk('tasks','update')]: true,
    [pk('dispatch','read')]: true, [pk('dispatch','update')]: true,
    [pk('locations','read')]: true, [pk('locations','update')]: true,
    [pk('spaces','read')]: true, [pk('spaces','update')]: true,
    [pk('zones','read')]: true, [pk('zones','update')]: true,
    [pk('manifest','read')]: true, [pk('manifest','update')]: true,
    [pk('compliance','read')]: true, [pk('compliance','update')]: true,
    [pk('reports','read')]: true,
  },
  management: {
    [pk('schedule','create')]: true, [pk('schedule','read')]: true, [pk('schedule','update')]: true,
    [pk('tasks','create')]: true, [pk('tasks','read')]: true, [pk('tasks','update')]: true,
    [pk('crew','read')]: true, [pk('crew','update')]: true,
    [pk('vendors','read')]: true, [pk('vendors','update')]: true,
    [pk('purchase_orders','create')]: true, [pk('purchase_orders','read')]: true, [pk('purchase_orders','update')]: true,
    [pk('dispatch','read')]: true, [pk('dispatch','update')]: true,
    [pk('work_orders','create')]: true, [pk('work_orders','read')]: true, [pk('work_orders','update')]: true,
    [pk('equipment','read')]: true, [pk('equipment','update')]: true,
    [pk('manifest','read')]: true, [pk('manifest','update')]: true,
    [pk('locations','read')]: true,
    [pk('spaces','read')]: true,
    [pk('zones','read')]: true,
    [pk('compliance','read')]: true,
    [pk('time_tracking','read')]: true, [pk('time_tracking','approve')]: true,
  },
  crew: {
    [pk('schedule','read')]: true,
    [pk('tasks','read')]: true, [pk('tasks','update')]: true,
    [pk('time_tracking','create')]: true, [pk('time_tracking','read')]: true, [pk('time_tracking','update')]: true,
    [pk('manifest','read')]: true,
    [pk('equipment','read')]: true,
  },
  staff: {
    [pk('schedule','read')]: true,
    [pk('tasks','read')]: true,
    [pk('time_tracking','create')]: true, [pk('time_tracking','read')]: true,
  },
  talent: {
    [pk('schedule','read')]: true,
    [pk('advances','read')]: true, [pk('advances','update')]: true,
    [pk('compliance','read')]: true,
  },
  vendor: {
    [pk('advances','read')]: true, [pk('advances','update')]: true,
    [pk('invoices','create')]: true, [pk('invoices','read')]: true, [pk('invoices','update')]: true,
    [pk('purchase_orders','read')]: true,
    [pk('equipment','read')]: true, [pk('equipment','update')]: true,
    [pk('manifest','read')]: true, [pk('manifest','update')]: true,
    [pk('compliance','read')]: true,
  },
  client: {
    [pk('projects','read')]: true,
    [pk('proposals','read')]: true, [pk('proposals','approve')]: true,
    [pk('invoices','read')]: true, [pk('invoices','approve')]: true,
    [pk('reports','read')]: true,
    [pk('events','read')]: true,
  },
  sponsor: {
    [pk('activations','read')]: true,
    [pk('events','read')]: true,
    [pk('reports','read')]: true,
  },
  press: {
    [pk('events','read')]: true,
    [pk('files','read')]: true,
  },
  guest: {
    [pk('events','read')]: true,
  },
  attendee: {
    [pk('events','read')]: true,
  },
};

/**
 * Map the legacy app PermissionAction vocabulary ('view'/'edit') to the RPC
 * vocabulary ('read'/'update'). Other actions pass through unchanged.
 * Used by the project-role guard so callers keep the existing view/edit API
 * without duplicating keys in the matrix.
 */
function appActionToProjectAction(action: PermissionAction): ProjectAction {
  if (action === 'view') return 'read';
  if (action === 'edit') return 'update';
  return action as ProjectAction;
}

/**
 * Check whether a project-scoped role permits an action on a resource.
 * Returns false for unknown roles, resources, or actions.
 */
export function getDefaultProjectPermission(
  role: ProjectRole,
  resource: PermissionResource,
  action: PermissionAction | ProjectAction
): boolean {
  const projectAction = typeof action === 'string'
    ? appActionToProjectAction(action as PermissionAction)
    : action;
  const key = `${resource}.${projectAction}`;
  return DEFAULT_PROJECT_PERMISSIONS[role]?.[key] ?? false;
}

export function getPortalPermission(
  role: 'client' | 'viewer' | 'community',
  key: string
): boolean {
  return PORTAL_PERMISSIONS[role]?.[key] ?? false;
}

/**
 * Contractor portal permission lookup — SSOT.
 * Reads from CONTRACTOR_PORTAL_PERMISSIONS for contractor/crew roles.
 * Closes the permission lookup gap identified in quality audit.
 */
export function getContractorPortalPermission(
  role: 'contractor' | 'crew',
  key: string
): boolean {
  return CONTRACTOR_PORTAL_PERMISSIONS[role]?.[key] ?? false;
}

