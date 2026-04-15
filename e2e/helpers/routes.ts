/**
 * FlyteDeck E2E — Master Route Registry
 *
 * Maps every application route to its access requirements:
 *   - minTier: minimum subscription tier to access the page
 *   - allowedRoles: roles that can view the page (null = all authenticated)
 *   - hasDynamicParams: whether the route has [id] segments
 *   - group: logical grouping for test organization
 *
 * Two-Tier RBAC Architecture (post migration 00135):
 *   INTERNAL: developer, owner, admin, controller, collaborator
 *   EXTERNAL: contractor, crew, client, viewer, community
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tier = 'portal' | 'free' | 'starter' | 'professional' | 'enterprise';
export type Role =
  | 'developer'
  | 'owner'
  | 'admin'
  | 'controller'
  | 'collaborator'
  | 'contractor'
  | 'crew'
  | 'client'
  | 'viewer'
  | 'community';

interface RouteEntry {
  path: string;
  minTier: Tier;
  allowedRoles: Role[] | null; // null = all internal roles
  hasDynamicParams: boolean;
  group: string;
}

// Shorthand helpers — canonical Two-Tier role groups
const ALL_INTERNAL: Role[] = [
  'developer', 'owner', 'admin', 'controller', 'collaborator',
];
const ADMIN_COLLAB: Role[] = ['developer', 'owner', 'admin', 'collaborator'];
const ADMIN_ONLY: Role[] = ['developer', 'owner', 'admin'];
const ADMIN_CTRL_COLLAB: Role[] = ['developer', 'owner', 'admin', 'controller', 'collaborator'];

// ─── Route Registry ──────────────────────────────────────────────────────────

const ROUTES: RouteEntry[] = [
  // ── Dashboard & Personal ──
  { path: '/app', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-tasks', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-inbox', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-schedule', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-documents', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/favorites', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/calendar', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },

  // ── Pipeline ──
  { path: '/app/pipeline', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/list', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/forecast', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/settings', minTier: 'portal', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/territories', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/commissions', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'pipeline' },

  // ── Clients ──
  { path: '/app/clients', minTier: 'portal', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/activity', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/map', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/segments', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'clients' },

  // ── Leads ──
  { path: '/app/leads', minTier: 'portal', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'leads' },
  { path: '/app/leads/forms', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'leads' },

  // ── Proposals ──
  { path: '/app/proposals', minTier: 'portal', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'proposals' },
  { path: '/app/proposals/new', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'proposals' },

  // ── Invoices ──
  { path: '/app/invoices', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },
  { path: '/app/invoices/credit-notes', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },
  { path: '/app/invoices/recurring', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },

  // ── Projects ──
  { path: '/app/projects', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'projects' },

  // ── Schedule ──
  { path: '/app/schedule', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/milestones', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/run-of-show', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/build-strike', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },

  // ── Fabrication ──
  { path: '/app/fabrication', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/bom', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/print', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/quality', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/shop-floor', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'fabrication' },

  // ── Procurement ──
  { path: '/app/procurement', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/purchase-orders', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/requisitions', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/suppliers', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/receiving', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },

  // ── Rentals ──
  { path: '/app/rentals', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/reservations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/returns', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/sub-rentals', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/utilization', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'rentals' },

  // ── Logistics ──
  { path: '/app/logistics', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/shipping', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/receiving', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/counts', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/goods-receipts', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/packing', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/scan', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/transfers', minTier: 'enterprise', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'logistics' },

  // ── Events ──
  { path: '/app/events', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/activations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/calendar', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/daily-reports', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/locations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/punch-list', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },

  // ── Advancing ──
  { path: '/app/advancing', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/allocations', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/submissions', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/approvals', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/assignments', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/fulfillment', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/quote', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },

  // ── Tasks ──
  { path: '/app/tasks', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/board', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/calendar', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/gantt', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/projects', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/workload', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },

  // ── Campaigns ──
  { path: '/app/campaigns', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/analytics', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/audiences', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/drafts', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/scheduled', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },

  // ── Dispatch ──
  { path: '/app/dispatch', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/board', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/history', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/routes', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'dispatch' },

  // ── Crew ──
  { path: '/app/crew', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/availability', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/onboarding', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/recruitment', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/schedule', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'crew' },

  // ── People ──
  { path: '/app/people', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/org-chart', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/time-off', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'people' },

  // ── Time ──
  { path: '/app/time', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timer', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timesheets', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },

  // ── Workloads ──
  { path: '/app/workloads', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/schedule', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/utilization', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'workloads' },

  // ── Compliance ──
  { path: '/app/compliance', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/certifications', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/cois', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/contracts', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/licenses', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/permits', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'compliance' },

  // ── Expenses ──
  { path: '/app/expenses', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/approvals', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/mileage', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/receipts', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },

  // ── Budgets ──
  { path: '/app/budgets', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'budgets' },

  // ── Profitability ──
  { path: '/app/profitability', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'profitability' },

  // ── Equipment ──
  { path: '/app/equipment', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/assets', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/bundles', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/check-in-out', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/inventory', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/maintenance', minTier: 'professional', allowedRoles: [...ADMIN_COLLAB], hasDynamicParams: false, group: 'equipment' },

  // ── Assets ──
  { path: '/app/assets', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'assets' },

  // ── Reports ──
  { path: '/app/reports', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/revenue', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/pipeline', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/funnel', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/win-rate', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/utilization', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/wip', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/forecast', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/builder', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/aging', minTier: 'portal', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/budget-vs-actual', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/crew-availability', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/equipment-utilization', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/expenses', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },

  // ── Automations (sub-pages) ──
  { path: '/app/automations/runs', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'automations' },
  { path: '/app/automations/templates', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'automations' },

  // ── Templates ──
  { path: '/app/templates', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'templates' },

  // ── Terms ──
  { path: '/app/terms', minTier: 'starter', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'terms' },

  // ── Automations ──
  { path: '/app/automations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'automations' },

  // ── Emails ──
  { path: '/app/emails', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'emails' },
  { path: '/app/emails/templates', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'emails' },

  // ── Files ──
  { path: '/app/files', minTier: 'portal', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'files' },

  // ── Integrations ──
  { path: '/app/integrations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'integrations' },
  { path: '/app/integrations/sync-errors', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'integrations' },

  // ── Goals ──
  { path: '/app/goals', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'goals' },

  // ── Roadmap ──
  { path: '/app/roadmap', minTier: 'portal', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'roadmap' },

  // ── Marketplace ──
  { path: '/app/marketplace', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'marketplace' },

  // ── Finance ──
  { path: '/app/finance', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices/credit-notes', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices/recurring', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/purchase-orders', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/vendors', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/profitability', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/budgets', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/revenue-recognition', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },

  // ── Portfolio ──
  { path: '/app/portfolio', minTier: 'starter', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'portfolio' },

  // ── Work Orders ──
  { path: '/app/work-orders', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'work-orders' },

  // ── Manifest ──
  { path: '/app/manifest', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'manifest' },

  // ── Locations ──
  { path: '/app/locations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'locations' },

  // ── Portal ──
  { path: '/app/portal', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'portal' },

  // ── AI ──
  { path: '/app/ai', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'ai' },

  // ── Settings ──
  { path: '/app/settings', minTier: 'free', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/profile', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/appearance', minTier: 'free', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/branding', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/team', minTier: 'starter', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/billing', minTier: 'free', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
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
  { path: '/app/settings/cost-rates', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/custom-fields', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/automations-config', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/integrations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/data-privacy', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/webhooks', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/security', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/security/mfa', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
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

export function getRoutesForRole(role: Role): RouteEntry[] {
  return ROUTES.filter(
    (r) => r.allowedRoles === null || r.allowedRoles.includes(role)
  );
}

export function getRoutesForTier(tier: Tier): RouteEntry[] {
  return ROUTES.filter((r) => tierMeetsMinimum(tier, r.minTier));
}

export function getRoutesForRoleAndTier(role: Role, tier: Tier): RouteEntry[] {
  return ROUTES.filter(
    (r) =>
      (r.allowedRoles === null || r.allowedRoles.includes(role)) &&
      tierMeetsMinimum(tier, r.minTier)
  );
}

export function getRoutesByGroup(group: string): RouteEntry[] {
  return ROUTES.filter((r) => r.group === group);
}

export function getAllRoutes(): RouteEntry[] {
  return [...ROUTES];
}

export function getGroups(): string[] {
  return [...new Set(ROUTES.map((r) => r.group))];
}
