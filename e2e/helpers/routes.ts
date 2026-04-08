/**
 * FlyteDeck E2E — Master Route Registry
 *
 * Maps every application route to its access requirements:
 *   - minTier: minimum subscription tier to access the page
 *   - allowedRoles: roles that can view the page (null = all authenticated)
 *   - hasDynamicParams: whether the route has [id] segments
 *   - group: logical grouping for test organization
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tier = 'portal' | 'free' | 'starter' | 'professional' | 'enterprise';
export type Role =
  | 'super_admin'
  | 'org_admin'
  | 'project_manager'
  | 'designer'
  | 'fabricator'
  | 'installer'
  | 'client_primary'
  | 'client_viewer';

export interface RouteEntry {
  path: string;
  minTier: Tier;
  allowedRoles: Role[] | null; // null = all internal roles
  hasDynamicParams: boolean;
  group: string;
}

// Shorthand helpers
const ALL_INTERNAL: Role[] = [
  'super_admin', 'org_admin', 'project_manager',
  'designer', 'fabricator', 'installer',
];
const ADMIN_PM: Role[] = ['super_admin', 'org_admin', 'project_manager'];
const ADMIN_ONLY: Role[] = ['super_admin', 'org_admin'];

// ─── Route Registry ──────────────────────────────────────────────────────────

export const ROUTES: RouteEntry[] = [
  // ── Dashboard & Personal ──
  { path: '/app', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-tasks', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-inbox', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-schedule', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-documents', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/favorites', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/calendar', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },

  // ── Pipeline ──
  { path: '/app/pipeline', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/list', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/forecast', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/settings', minTier: 'portal', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/territories', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/commissions', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'pipeline' },

  // ── Clients ──
  { path: '/app/clients', minTier: 'portal', allowedRoles: [...ADMIN_PM, 'designer'], hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/contacts', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/activity', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'clients' },

  // ── Leads ──
  { path: '/app/leads', minTier: 'portal', allowedRoles: [...ADMIN_PM, 'designer'], hasDynamicParams: false, group: 'leads' },
  { path: '/app/leads/forms', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'leads' },
  { path: '/app/leads/scoring', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'leads' },

  // ── Proposals ──
  { path: '/app/proposals', minTier: 'portal', allowedRoles: [...ADMIN_PM, 'designer'], hasDynamicParams: false, group: 'proposals' },
  { path: '/app/proposals/new', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'proposals' },

  // ── Invoices ──
  { path: '/app/invoices', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'invoices' },

  // ── Schedule ──
  { path: '/app/schedule', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/milestones', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/run-of-show', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/build-strike', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },

  // ── Fabrication ──
  { path: '/app/fabrication', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator'], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/bom', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator'], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/print', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator'], hasDynamicParams: false, group: 'fabrication' },

  // ── Procurement ──
  { path: '/app/procurement', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/purchase-orders', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/requisitions', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/suppliers', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/receiving', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'procurement' },

  // ── Rentals ──
  { path: '/app/rentals', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/reservations', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/returns', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/sub-rentals', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/utilization', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'rentals' },

  // ── Logistics ──
  { path: '/app/logistics', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/shipping', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/receiving', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'logistics' },

  // ── Events ──
  { path: '/app/events', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/daily-reports', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/punch-list', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },

  // ── Advancing ──
  { path: '/app/advancing', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/allocations', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/submissions', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/approvals', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/assignments', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'advancing' },

  // ── Tasks ──
  { path: '/app/tasks', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/board', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/calendar', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/gantt', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/projects', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/workload', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },

  // ── Campaigns ──
  { path: '/app/campaigns', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/analytics', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'campaigns' },

  // ── Dispatch ──
  { path: '/app/dispatch', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'dispatch' },

  // ── Crew ──
  { path: '/app/crew', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/roster', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/bookings', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/availability', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/onboarding', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'crew' },

  // ── People ──
  { path: '/app/people', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/org-chart', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/time-off', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'people' },

  // ── Time ──
  { path: '/app/time', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timer', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timesheets', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },

  // ── Workloads ──
  { path: '/app/workloads', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/schedule', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/utilization', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'workloads' },

  // ── Finance ──
  { path: '/app/finance', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'finance' },

  // ── Expenses ──
  { path: '/app/expenses', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },

  // ── Budgets ──
  { path: '/app/budgets', minTier: 'enterprise', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'budgets' },

  // ── Equipment ──
  { path: '/app/equipment', minTier: 'professional', allowedRoles: [...ADMIN_PM, 'fabricator', 'installer'], hasDynamicParams: false, group: 'equipment' },

  // ── Assets ──
  { path: '/app/assets', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'assets' },

  // ── Reports ──
  { path: '/app/reports', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/revenue', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/pipeline', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/funnel', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/win-rate', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/utilization', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/wip', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/forecast', minTier: 'portal', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/builder', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'reports' },

  // ── Portfolio ──
  { path: '/app/portfolio', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'portfolio' },

  // ── Templates ──
  { path: '/app/templates', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'templates' },

  // ── Terms ──
  { path: '/app/terms', minTier: 'starter', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'terms' },

  // ── Files ──
  { path: '/app/files', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'files' },

  // ── Automations ──
  { path: '/app/automations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'automations' },

  // ── Emails ──
  { path: '/app/emails', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'emails' },

  // ── Integrations ──
  { path: '/app/integrations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'integrations' },

  // ── Compliance ──
  { path: '/app/compliance', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },

  // ── Goals ──
  { path: '/app/goals', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'goals' },

  // ── Roadmap ──
  { path: '/app/roadmap', minTier: 'professional', allowedRoles: ADMIN_PM, hasDynamicParams: false, group: 'roadmap' },

  // ── AI ──
  { path: '/app/ai', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'ai' },

  // ── Settings ──
  { path: '/app/settings', minTier: 'free', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/profile', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/appearance', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/branding', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/team', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/billing', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/payment-terms', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/payments', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/tax', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/facilities', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/localization', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/tags', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/notifications', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/document-defaults', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/email-templates', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/calendar-sync', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/cost-rates', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/custom-fields', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/automations-config', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/integrations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/data-privacy', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/security', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/security/permissions', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/security/audit-log', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/sso', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/api-keys', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/audit-log', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIER_RANK: Record<Tier, number> = {
  portal: -1,
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function tierMeetsMinimum(current: Tier, required: Tier): boolean {
  return TIER_RANK[current] >= TIER_RANK[required];
}

export function getRoutesByGroup(group: string): RouteEntry[] {
  return ROUTES.filter((r) => r.group === group);
}

export function getRouteGroups(): string[] {
  return [...new Set(ROUTES.map((r) => r.group))];
}

export function canRoleAccess(route: RouteEntry, role: Role): boolean {
  if (!route.allowedRoles) return true;
  return route.allowedRoles.includes(role);
}
