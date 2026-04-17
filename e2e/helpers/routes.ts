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
 *
 * SSOT: This registry MUST mirror the actual enforcement layer:
 *   1. src/lib/permissions.ts - DEFAULT_PERMISSIONS matrix
 *   2. src/app/app/[module]/layout.tsx - RoleGate resource/allowedRoles props
 *   3. src/components/shared/RoleGate.tsx - client-side route guard
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tier = 'access' | 'core' | 'professional' | 'enterprise';
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

// ─── Shorthand role groups (mirrors src/lib/permissions.ts) ──────────────────
//
// These MUST align with what the RoleGate + DEFAULT_PERMISSIONS actually enforce.
// Controller has viewOnly on most resources. Viewer only has viewOnly on a small subset.
//
const ALL_INTERNAL: Role[] = [
  'developer', 'owner', 'admin', 'controller', 'collaborator',
];
const ADMIN_CTRL_COLLAB: Role[] = ['developer', 'owner', 'admin', 'controller', 'collaborator'];
const ADMIN_COLLAB: Role[] = ['developer', 'owner', 'admin', 'collaborator'];
const ADMIN_ONLY: Role[] = ['developer', 'owner', 'admin'];

// ─── Route Registry ──────────────────────────────────────────────────────────

const ROUTES: RouteEntry[] = [
  // ── Dashboard & Personal ──
  { path: '/app', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-tasks', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-inbox', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-schedule', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/my-documents', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/favorites', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },
  { path: '/app/calendar', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'dashboard' },

  // ── Pipeline ── (RoleGate resource="pipeline", controller: viewOnly)
  { path: '/app/pipeline', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/list', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/forecast', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/settings', minTier: 'access', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/territories', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'pipeline' },
  { path: '/app/pipeline/commissions', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'pipeline' },

  // ── Clients ── (RoleGate resource="clients", controller: viewOnly)
  { path: '/app/clients', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/activity', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/map', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'clients' },
  { path: '/app/clients/segments', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'clients' },

  // ── Leads ── (RoleGate resource="leads", controller: viewOnly)
  { path: '/app/leads', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'leads' },
  { path: '/app/leads/forms', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'leads' },

  // ── Proposals ── (RoleGate resource="proposals", controller: viewOnly)
  { path: '/app/proposals', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'proposals' },
  { path: '/app/proposals/new', minTier: 'core', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'proposals' },

  // ── Invoices ── (RoleGate via finance layout resource="invoices", controller: allActions)
  { path: '/app/invoices', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },
  { path: '/app/invoices/credit-notes', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },
  { path: '/app/invoices/recurring', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'invoices' },

  // ── Projects ── (RoleGate resource="projects", controller: viewOnly)
  { path: '/app/projects', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'projects' },

  // ── Schedule ── (RoleGate resource="schedule", controller: viewOnly)
  { path: '/app/schedule', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/milestones', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/run-of-show', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },
  { path: '/app/schedule/build-strike', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'schedule' },

  // ── Fabrication ── (RoleGate resource="fabrication", controller: viewOnly)
  { path: '/app/fabrication', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/bom', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/print', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/quality', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'fabrication' },
  { path: '/app/fabrication/shop-floor', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'fabrication' },

  // ── Procurement ── (RoleGate allowedRoles=['developer','owner','admin','controller','collaborator'])
  { path: '/app/procurement', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/purchase-orders', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/requisitions', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/suppliers', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },
  { path: '/app/procurement/receiving', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'procurement' },

  // ── Rentals ── (RoleGate resource="rentals", controller: viewOnly on ALL)
  { path: '/app/rentals', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/reservations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/returns', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/sub-rentals', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },
  { path: '/app/rentals/utilization', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'rentals' },

  // ── Logistics ── (RoleGate resource="warehouse", controller: noPerm — DENIED)
  { path: '/app/logistics', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/shipping', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/receiving', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/counts', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/goods-receipts', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/packing', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/scan', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },
  { path: '/app/logistics/transfers', minTier: 'enterprise', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'logistics' },

  // ── Events ── (RoleGate resource="events", controller: viewOnly)
  { path: '/app/events', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/activations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/calendar', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/daily-reports', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/locations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },
  { path: '/app/events/punch-list', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'events' },

  // ── Advancing ── (RoleGate resource="advances")
  { path: '/app/advancing', minTier: 'core', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/allocations', minTier: 'core', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/submissions', minTier: 'core', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/approvals', minTier: 'core', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/assignments', minTier: 'core', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/fulfillment', minTier: 'core', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },
  { path: '/app/advancing/quote', minTier: 'core', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'advancing' },

  // ── Tasks ── (RoleGate resource="tasks", controller: viewOnly)
  { path: '/app/tasks', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/board', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/calendar', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/gantt', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/projects', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },
  { path: '/app/tasks/workload', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'tasks' },

  // ── Campaigns ── (RoleGate allowedRoles=['developer','owner','admin','collaborator'], controller EXCLUDED)
  { path: '/app/campaigns', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/analytics', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/audiences', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/drafts', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },
  { path: '/app/campaigns/scheduled', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'campaigns' },

  // ── Dispatch ── (RoleGate resource="dispatch", controller: viewOnly)
  { path: '/app/dispatch', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/board', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/history', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'dispatch' },
  { path: '/app/dispatch/routes', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'dispatch' },

  // ── Crew ── (RoleGate resource="crew", controller: viewOnly)
  { path: '/app/crew', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/availability', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/onboarding', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/recruitment', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'crew' },
  { path: '/app/crew/schedule', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'crew' },

  // ── People ── (RoleGate bare — no resource, passes ALL_INTERNAL)
  { path: '/app/people', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/org-chart', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'people' },
  { path: '/app/people/time-off', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'people' },

  // ── Time ── (RoleGate bare)
  { path: '/app/time', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timer', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },
  { path: '/app/time/timesheets', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'time' },

  // ── Workloads ── (RoleGate resource="workloads", controller: viewOnly)
  { path: '/app/workloads', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/schedule', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'workloads' },
  { path: '/app/workloads/utilization', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'workloads' },

  // ── Compliance ── (RoleGate resource="compliance", controller: viewOnly)
  { path: '/app/compliance', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/certifications', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/cois', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/contracts', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/licenses', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },
  { path: '/app/compliance/permits', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'compliance' },

  // ── Expenses ── (RoleGate resource="expenses", controller: allActions)
  { path: '/app/expenses', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/approvals', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/mileage', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },
  { path: '/app/expenses/receipts', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'expenses' },

  // ── Budgets ── (RoleGate resource="budgets", controller: allActions)
  { path: '/app/budgets', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'budgets' },

  // ── Profitability ── (RoleGate resource="profitability", controller: allActions)
  { path: '/app/profitability', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'profitability' },

  // ── Equipment ── (RoleGate resource="equipment", controller: viewOnly)
  { path: '/app/equipment', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/assets', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/bundles', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/check-in-out', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/inventory', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'equipment' },
  { path: '/app/equipment/maintenance', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'equipment' },

  // ── Assets ── (RoleGate resource="assets", controller: viewOnly)
  { path: '/app/assets', minTier: 'core', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'assets' },

  // ── Reports ── (RoleGate resource="reports", controller: viewCreate)
  { path: '/app/reports', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/revenue', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/pipeline', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/funnel', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/win-rate', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/utilization', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/wip', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/forecast', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/builder', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/aging', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/budget-vs-actual', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/crew-availability', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/equipment-utilization', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },
  { path: '/app/reports/expenses', minTier: 'enterprise', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'reports' },

  // ── Automations ── (RoleGate resource="automations", controller: noPerm — DENIED)
  { path: '/app/automations', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'automations' },
  { path: '/app/automations/runs', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'automations' },
  { path: '/app/automations/templates', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'automations' },

  // ── Templates ── (RoleGate resource="templates", controller: viewOnly)
  { path: '/app/templates', minTier: 'core', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'templates' },

  // ── Terms ── (RoleGate resource="terms", controller: viewOnly)
  { path: '/app/terms', minTier: 'core', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'terms' },

  // ── Emails ── (RoleGate resource="email_inbox", controller: viewOnly)
  { path: '/app/emails', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'emails' },
  { path: '/app/emails/templates', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'emails' },

  // ── Files ── (RoleGate bare — passes ALL_INTERNAL)
  { path: '/app/files', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'files' },

  // ── Integrations ── (RoleGate resource="integrations", controller: noPerm — DENIED)
  { path: '/app/integrations', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'integrations' },
  { path: '/app/integrations/sync-errors', minTier: 'professional', allowedRoles: ADMIN_COLLAB, hasDynamicParams: false, group: 'integrations' },

  // ── Goals ── (RoleGate resource="goals", controller: viewOnly)
  { path: '/app/goals', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'goals' },

  // ── Roadmap ── (RoleGate resource="roadmap", controller: viewOnly)
  { path: '/app/roadmap', minTier: 'access', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'roadmap' },

  // ── Marketplace ── (RoleGate resource="marketplace", controller: viewOnly)
  { path: '/app/marketplace', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'marketplace' },

  // ── Finance ── (RoleGate resource="invoices", controller: allActions)
  { path: '/app/finance', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices/credit-notes', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/invoices/recurring', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/purchase-orders', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/vendors', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/profitability', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/budgets', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },
  { path: '/app/finance/revenue-recognition', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'finance' },

  // ── Portfolio ── (RoleGate resource="portfolio", controller: viewOnly)
  { path: '/app/portfolio', minTier: 'core', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'portfolio' },

  // ── Work Orders ── (RoleGate resource="work_orders", controller: viewOnly)
  { path: '/app/work-orders', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'work-orders' },

  // ── Manifest ── (RoleGate resource="manifest", controller: viewOnly)
  { path: '/app/manifest', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'manifest' },

  // ── Locations ── (RoleGate resource="locations", controller: viewOnly)
  { path: '/app/locations', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'locations' },

  // ── Portal ── (RoleGate resource="portals", controller: viewOnly)
  { path: '/app/portal', minTier: 'professional', allowedRoles: ADMIN_CTRL_COLLAB, hasDynamicParams: false, group: 'portal' },

  // ── AI ── (RoleGate resource="ai_assistant", controller: viewOnly)
  { path: '/app/ai', minTier: 'enterprise', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'ai' },

  // ── Settings ── (RoleGate allowedRoles=ALL_INTERNAL at root, requiresAdmin filter for sub-pages)
  { path: '/app/settings', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/profile', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/appearance', minTier: 'access', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/branding', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/team', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/billing', minTier: 'access', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/payment-terms', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/payments', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/tax', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/facilities', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/localization', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/tags', minTier: 'core', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/notifications', minTier: 'core', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/document-defaults', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/email-templates', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/calendar-sync', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/cost-rates', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/custom-fields', minTier: 'enterprise', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/automations-config', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/integrations', minTier: 'professional', allowedRoles: ADMIN_ONLY, hasDynamicParams: false, group: 'settings' },
  { path: '/app/settings/data-privacy', minTier: 'professional', allowedRoles: ALL_INTERNAL, hasDynamicParams: false, group: 'settings' },
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
  access: 0,
  core: 1,
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
