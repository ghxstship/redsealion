import type { OrganizationRole } from '@/types/database';

// ---------------------------------------------------------------------------
// Resource & Action types
// ---------------------------------------------------------------------------

export type PermissionResource =
  | 'proposals'
  | 'pipeline'
  | 'clients'
  | 'invoices'
  | 'expenses'
  | 'budgets'
  | 'time_tracking'
  | 'tasks'
  | 'reports'
  | 'assets'
  | 'team'
  | 'integrations'
  | 'automations'
  | 'settings'
  | 'ai_assistant'
  | 'crew'
  | 'equipment'
  | 'leads'
  | 'warehouse'
  | 'resources'
  | 'ai_drafting'
  | 'email_campaigns'
  | 'referral_program'
  | 'work_orders'
  | 'advances';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const ALL_RESOURCES: PermissionResource[] = [
  'proposals',
  'pipeline',
  'clients',
  'invoices',
  'expenses',
  'budgets',
  'time_tracking',
  'tasks',
  'reports',
  'assets',
  'team',
  'integrations',
  'automations',
  'settings',
  'ai_assistant',
  'crew',
  'equipment',
  'leads',
  'warehouse',
  'resources',
  'ai_drafting',
  'email_campaigns',
  'referral_program',
  'work_orders',
  'advances',
];

/**
 * Maps modern Harbor Master database roles to legacy Enum roles used by the permissions system.
 */
export function mapDBRoleToEnum(roleName: string): OrganizationRole {
  return roleName === 'platform_admin' || roleName === 'platform_superadmin' ? 'super_admin'
    : roleName === 'owner' || roleName === 'org_owner' ? 'org_admin'
    : roleName === 'admin' || roleName === 'org_admin' ? 'org_admin'
    : roleName === 'manager' || roleName === 'project_manager' ? 'project_manager'
    : roleName === 'member' ? 'designer' // Standard internal members map to legacy designer role for capability parity
    : roleName === 'viewer' ? 'client_viewer'
    : roleName === 'guest' || roleName === 'external_collaborator' ? 'client_viewer'
    : 'designer';
}

export const ALL_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete'];

export const INTERNAL_ROLES: OrganizationRole[] = [
  'super_admin',
  'org_admin',
  'project_manager',
  'designer',
  'fabricator',
  'installer',
];

export const CLIENT_ROLES: OrganizationRole[] = ['client_primary', 'client_viewer'];

// ---------------------------------------------------------------------------
// Permission key helper
// ---------------------------------------------------------------------------

export function permKey(resource: PermissionResource, action: PermissionAction): string {
  return `${resource}.${action}`;
}

// ---------------------------------------------------------------------------
// Default permission matrix — used when the permissions table has no overrides
// ---------------------------------------------------------------------------

function allActions(resources: PermissionResource[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const r of resources) {
    for (const a of ALL_ACTIONS) {
      m[permKey(r, a)] = true;
    }
  }
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
  for (const r of resources) {
    for (const a of ALL_ACTIONS) {
      m[permKey(r, a)] = false;
    }
  }
  return m;
}

export const DEFAULT_PERMISSIONS: Record<OrganizationRole, Record<string, boolean>> = {
  // super_admin & org_admin — full access to everything
  super_admin: allActions(ALL_RESOURCES),
  org_admin: allActions(ALL_RESOURCES),

  // project_manager — manages most resources, no settings/integrations, no delete
  project_manager: {
    ...allActions(['proposals', 'pipeline', 'clients', 'invoices', 'budgets', 'automations']),
    // remove delete on key resources
    [permKey('proposals', 'delete')]: false,
    [permKey('pipeline', 'delete')]: false,
    [permKey('clients', 'delete')]: false,
    [permKey('invoices', 'delete')]: false,
    [permKey('budgets', 'delete')]: false,
    [permKey('automations', 'delete')]: false,
    // expenses — full CRUD (own, but simplified to boolean here)
    ...allActions(['expenses', 'time_tracking', 'tasks']),
    [permKey('expenses', 'delete')]: false,
    [permKey('time_tracking', 'delete')]: false,
    [permKey('tasks', 'delete')]: false,
    // reports — view and create
    [permKey('reports', 'view')]: true,
    [permKey('reports', 'create')]: true,
    [permKey('reports', 'edit')]: true,
    [permKey('reports', 'delete')]: false,
    // assets — manage
    ...allActions(['assets']),
    [permKey('assets', 'delete')]: false,
    // team — view only
    ...viewOnly(['team']),
    // integrations — none
    ...noPerm(['integrations']),
    // settings — none
    ...noPerm(['settings']),
    // ai — view (use)
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — manage (no delete)
    ...allActions(['crew']),
    [permKey('crew', 'delete')]: false,
    // equipment — manage (no delete)
    ...allActions(['equipment']),
    [permKey('equipment', 'delete')]: false,
    // leads — manage (no delete)
    ...allActions(['leads']),
    [permKey('leads', 'delete')]: false,
    // warehouse — manage (no delete)
    ...allActions(['warehouse']),
    [permKey('warehouse', 'delete')]: false,
    // advances — manage (no delete)
    ...allActions(['advances']),
    [permKey('advances', 'delete')]: false,
  },

  // designer — creative focus
  designer: {
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
    [permKey('expenses', 'view')]: true,
    [permKey('expenses', 'create')]: true,
    [permKey('expenses', 'edit')]: true,
    [permKey('expenses', 'delete')]: false,
    // time tracking — own
    [permKey('time_tracking', 'view')]: true,
    [permKey('time_tracking', 'create')]: true,
    [permKey('time_tracking', 'edit')]: true,
    [permKey('time_tracking', 'delete')]: false,
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
    [permKey('team', 'view')]: true,
    [permKey('team', 'create')]: false,
    [permKey('team', 'edit')]: false,
    [permKey('team', 'delete')]: false,
    // ai — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — view only
    ...viewOnly(['crew']),
    // equipment — view + edit (design assets)
    [permKey('equipment', 'view')]: true,
    [permKey('equipment', 'create')]: false,
    [permKey('equipment', 'edit')]: true,
    [permKey('equipment', 'delete')]: false,
    // leads — view only
    ...viewOnly(['leads']),
    // warehouse — view only
    ...viewOnly(['warehouse']),
    // advances — view + create + edit
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: true,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
  },

  // fabricator — production focus
  fabricator: {
    [permKey('proposals', 'view')]: true,
    [permKey('proposals', 'create')]: false,
    [permKey('proposals', 'edit')]: false,
    [permKey('proposals', 'delete')]: false,
    ...noPerm(['pipeline', 'clients', 'invoices', 'budgets', 'reports', 'integrations', 'automations', 'settings']),
    // expenses — own
    [permKey('expenses', 'view')]: true,
    [permKey('expenses', 'create')]: true,
    [permKey('expenses', 'edit')]: true,
    [permKey('expenses', 'delete')]: false,
    // time tracking — own
    [permKey('time_tracking', 'view')]: true,
    [permKey('time_tracking', 'create')]: true,
    [permKey('time_tracking', 'edit')]: true,
    [permKey('time_tracking', 'delete')]: false,
    // tasks — assigned
    [permKey('tasks', 'view')]: true,
    [permKey('tasks', 'create')]: false,
    [permKey('tasks', 'edit')]: true,
    [permKey('tasks', 'delete')]: false,
    // assets — view
    [permKey('assets', 'view')]: true,
    [permKey('assets', 'create')]: false,
    [permKey('assets', 'edit')]: false,
    [permKey('assets', 'delete')]: false,
    // team — view
    [permKey('team', 'view')]: true,
    [permKey('team', 'create')]: false,
    [permKey('team', 'edit')]: false,
    [permKey('team', 'delete')]: false,
    // ai — use
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — view only
    ...viewOnly(['crew']),
    // equipment — view + edit (fabrication)
    [permKey('equipment', 'view')]: true,
    [permKey('equipment', 'create')]: true,
    [permKey('equipment', 'edit')]: true,
    [permKey('equipment', 'delete')]: false,
    // leads — none
    ...noPerm(['leads']),
    // warehouse — view + edit (production floor)
    [permKey('warehouse', 'view')]: true,
    [permKey('warehouse', 'create')]: true,
    [permKey('warehouse', 'edit')]: true,
    [permKey('warehouse', 'delete')]: false,
    // advances — view + create + edit (fabrication orders)
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: true,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
  },

  // installer — same as fabricator
  installer: {
    [permKey('proposals', 'view')]: true,
    [permKey('proposals', 'create')]: false,
    [permKey('proposals', 'edit')]: false,
    [permKey('proposals', 'delete')]: false,
    ...noPerm(['pipeline', 'clients', 'invoices', 'budgets', 'reports', 'integrations', 'automations', 'settings']),
    [permKey('expenses', 'view')]: true,
    [permKey('expenses', 'create')]: true,
    [permKey('expenses', 'edit')]: true,
    [permKey('expenses', 'delete')]: false,
    [permKey('time_tracking', 'view')]: true,
    [permKey('time_tracking', 'create')]: true,
    [permKey('time_tracking', 'edit')]: true,
    [permKey('time_tracking', 'delete')]: false,
    [permKey('tasks', 'view')]: true,
    [permKey('tasks', 'create')]: false,
    [permKey('tasks', 'edit')]: true,
    [permKey('tasks', 'delete')]: false,
    [permKey('assets', 'view')]: true,
    [permKey('assets', 'create')]: false,
    [permKey('assets', 'edit')]: false,
    [permKey('assets', 'delete')]: false,
    [permKey('team', 'view')]: true,
    [permKey('team', 'create')]: false,
    [permKey('team', 'edit')]: false,
    [permKey('team', 'delete')]: false,
    [permKey('ai_assistant', 'view')]: true,
    [permKey('ai_assistant', 'create')]: false,
    [permKey('ai_assistant', 'edit')]: false,
    [permKey('ai_assistant', 'delete')]: false,
    // crew — view only
    ...viewOnly(['crew']),
    // equipment — view + edit (install work)
    [permKey('equipment', 'view')]: true,
    [permKey('equipment', 'create')]: false,
    [permKey('equipment', 'edit')]: true,
    [permKey('equipment', 'delete')]: false,
    // leads — none
    ...noPerm(['leads']),
    // warehouse — view + edit (pick/pack)
    [permKey('warehouse', 'view')]: true,
    [permKey('warehouse', 'create')]: true,
    [permKey('warehouse', 'edit')]: true,
    [permKey('warehouse', 'delete')]: false,
    // advances — view + create + edit (install orders)
    [permKey('advances', 'view')]: true,
    [permKey('advances', 'create')]: true,
    [permKey('advances', 'edit')]: true,
    [permKey('advances', 'delete')]: false,
  },

  // Client roles — portal only, no admin app access
  client_primary: noPerm(ALL_RESOURCES),
  client_viewer: noPerm(ALL_RESOURCES),
};

// ---------------------------------------------------------------------------
// Client portal permissions (separate from admin app)
// ---------------------------------------------------------------------------

export type PortalAction = 'view' | 'comment' | 'approve' | 'pay' | 'upload';

export const PORTAL_PERMISSIONS: Record<'client_primary' | 'client_viewer', Record<string, boolean>> = {
  client_primary: {
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
  client_viewer: {
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
  role: 'client_primary' | 'client_viewer',
  key: string
): boolean {
  return PORTAL_PERMISSIONS[role]?.[key] ?? false;
}
