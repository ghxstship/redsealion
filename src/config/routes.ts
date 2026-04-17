/**
 * Canonical route registry for Red Sea Lion.
 *
 * Closes closure ticket C-INT-02 from
 * docs/audit/role-lifecycle/05-closure-plan.md.
 *
 * Every authenticated app route must be declared here with its
 * required permission. Middleware and RoleGate read this registry
 * to enforce consistent access control across server + client.
 */

import type { PermissionResource } from '@/lib/permissions';
import type { ProjectRole } from '@/lib/permissions';

export type RouteAction = 'view' | 'create' | 'edit' | 'delete';

/**
 * Product surface that a route belongs to.
 * Used by nav components to group routes.
 */
export type ProductSurface = 'atlvs' | 'compvss' | 'gvteway' | 'shared';

export interface RouteDefinition {
  /** Next.js route pattern (e.g. "/app/pipeline", "/app/projects/[id]"). */
  path: string;
  /** Product surface this route belongs to. */
  surface: ProductSurface;
  /** Required platform/project permission to VIEW this route. */
  resource: PermissionResource;
  action: RouteAction;
  /** Project roles that land here by default (role-aware home). */
  roleLandingFor?: ProjectRole[];
  /** Subscription feature gate, if applicable. */
  feature?: string;
  /** Navigation label — optional, used by nav scaffolding. */
  label?: string;
}

export const ROUTE_REGISTRY: readonly RouteDefinition[] = [
  // --- ATLVS (Ops/PM) ---
  { path: '/app/dashboard',      surface: 'atlvs', resource: 'reports',         action: 'view', label: 'Dashboard' },
  { path: '/app/pipeline',       surface: 'atlvs', resource: 'pipeline',        action: 'view', label: 'Pipeline' },
  { path: '/app/pipeline/[id]',  surface: 'atlvs', resource: 'pipeline',        action: 'view' },
  { path: '/app/leads',          surface: 'atlvs', resource: 'leads',           action: 'view', label: 'Leads' },
  { path: '/app/clients',        surface: 'atlvs', resource: 'clients',         action: 'view', label: 'Clients' },
  { path: '/app/proposals',      surface: 'atlvs', resource: 'proposals',       action: 'view', label: 'Proposals' },
  { path: '/app/invoices',       surface: 'atlvs', resource: 'invoices',        action: 'view', label: 'Invoices' },
  { path: '/app/budgets',        surface: 'atlvs', resource: 'budgets',         action: 'view', label: 'Budgets' },
  { path: '/app/finance',        surface: 'atlvs', resource: 'finance',         action: 'view', label: 'Finance' },
  { path: '/app/expenses',       surface: 'atlvs', resource: 'expenses',        action: 'view', label: 'Expenses' },
  { path: '/app/reports',        surface: 'atlvs', resource: 'reports',         action: 'view', label: 'Reports' },
  { path: '/app/profitability',  surface: 'atlvs', resource: 'profitability',   action: 'view', label: 'Profitability' },
  { path: '/app/campaigns',      surface: 'atlvs', resource: 'campaigns',       action: 'view', label: 'Campaigns' },
  { path: '/app/tasks',          surface: 'atlvs', resource: 'tasks',           action: 'view', label: 'Tasks' },
  { path: '/app/schedule',       surface: 'atlvs', resource: 'schedule',        action: 'view', label: 'Schedule' },
  { path: '/app/calendar',       surface: 'atlvs', resource: 'calendar',        action: 'view', label: 'Calendar' },
  { path: '/app/projects',       surface: 'atlvs', resource: 'projects',        action: 'view', label: 'Projects' },
  { path: '/app/projects/[id]',  surface: 'atlvs', resource: 'projects',        action: 'view' },
  { path: '/app/portfolio',      surface: 'atlvs', resource: 'portfolio',       action: 'view', label: 'Portfolio' },
  { path: '/app/goals',          surface: 'atlvs', resource: 'goals',           action: 'view', label: 'Goals' },
  { path: '/app/roadmap',        surface: 'atlvs', resource: 'roadmap',         action: 'view', label: 'Roadmap' },
  { path: '/app/workloads',      surface: 'atlvs', resource: 'workloads',       action: 'view', label: 'Workloads' },

  // --- COMPVSS (Crew/Production) ---
  { path: '/app/crew',           surface: 'compvss', resource: 'crew',          action: 'view', label: 'Crew',           roleLandingFor: ['crew','staff'] },
  { path: '/app/advancing',      surface: 'compvss', resource: 'advances',      action: 'view', label: 'Advancing',      roleLandingFor: ['production','talent'] },
  { path: '/app/dispatch',       surface: 'compvss', resource: 'dispatch',      action: 'view', label: 'Dispatch',       roleLandingFor: ['management'] },
  { path: '/app/work-orders',    surface: 'compvss', resource: 'work_orders',   action: 'view', label: 'Work Orders' },
  { path: '/app/events',         surface: 'compvss', resource: 'events',        action: 'view', label: 'Events',         roleLandingFor: ['sponsor','press','guest','attendee'] },
  { path: '/app/activations',    surface: 'compvss', resource: 'activations',   action: 'view', label: 'Activations' },
  { path: '/app/equipment',      surface: 'compvss', resource: 'equipment',     action: 'view', label: 'Equipment' },
  { path: '/app/fabrication',    surface: 'compvss', resource: 'fabrication',   action: 'view', label: 'Fabrication' },
  { path: '/app/procurement',    surface: 'compvss', resource: 'purchase_orders', action: 'view', label: 'Procurement',  roleLandingFor: ['vendor'] },
  { path: '/app/marketplace',    surface: 'compvss', resource: 'marketplace',   action: 'view', label: 'Marketplace' },
  { path: '/app/rentals',        surface: 'compvss', resource: 'rentals',       action: 'view', label: 'Rentals' },
  { path: '/app/manifest',       surface: 'compvss', resource: 'manifest',      action: 'view', label: 'Manifest' },
  { path: '/app/compliance',     surface: 'compvss', resource: 'compliance',    action: 'view', label: 'Compliance' },
  { path: '/app/locations',      surface: 'compvss', resource: 'locations',     action: 'view', label: 'Locations' },

  // --- GVTEWAY (Consumer/Contractor portal) ---
  { path: '/portal',                                             surface: 'gvteway', resource: 'portals',         action: 'view', label: 'Portal',       roleLandingFor: ['client'] },
  { path: '/portal/[orgSlug]/app',                                surface: 'gvteway', resource: 'project_portals', action: 'view' },
  { path: '/portal/[orgSlug]/contractor',                         surface: 'gvteway', resource: 'project_portals', action: 'view' },

  // --- Shared ---
  { path: '/app/settings',       surface: 'shared', resource: 'settings',       action: 'view', label: 'Settings',       roleLandingFor: ['executive'] },
  { path: '/app/integrations',   surface: 'shared', resource: 'integrations',   action: 'view', label: 'Integrations' },
  { path: '/app/automations',    surface: 'shared', resource: 'automations',    action: 'view', label: 'Automations' },
  { path: '/app/ai',             surface: 'shared', resource: 'ai_assistant',   action: 'view', label: 'AI' },
  { path: '/app/files',          surface: 'shared', resource: 'files',          action: 'view', label: 'Files' },
  { path: '/app/people',         surface: 'shared', resource: 'team',           action: 'view', label: 'People' },
] as const;

/**
 * Look up the route definition that matches a given Next.js pathname.
 * Uses longest-prefix + dynamic-segment match against the registry.
 */
export function findRoute(pathname: string): RouteDefinition | undefined {
  let best: RouteDefinition | undefined;
  let bestScore = -1;
  for (const r of ROUTE_REGISTRY) {
    const pattern = new RegExp(
      '^' + r.path.replace(/\[[^\]]+\]/g, '[^/]+').replace(/\//g, '\\/') + '(\\/|$)'
    );
    if (pattern.test(pathname)) {
      const score = r.path.length;
      if (score > bestScore) { best = r; bestScore = score; }
    }
  }
  return best;
}

/**
 * Return the landing route slug for a given project role.
 * Defaults to /app/dashboard when no role-specific landing exists.
 */
export function landingRouteForRole(role: ProjectRole): string {
  const match = ROUTE_REGISTRY.find(r => r.roleLandingFor?.includes(role));
  return match?.path ?? '/app/dashboard';
}

export function routesBySurface(surface: ProductSurface): RouteDefinition[] {
  return ROUTE_REGISTRY.filter(r => r.surface === surface);
}

export function navigableRoutes(): RouteDefinition[] {
  return ROUTE_REGISTRY.filter(r => !!r.label);
}
