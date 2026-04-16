/**
 * Canonical route segment label registry — SSOT for human-readable
 * breadcrumb labels.
 *
 * Used by Breadcrumbs component to display friendly names for URL
 * path segments. Only segments that aren't self-explanatory need
 * entries here (the Breadcrumbs component auto-capitalizes others).
 *
 * @module config/route-labels
 */

export const SEGMENT_LABELS: Record<string, string> = {
  /* Top-level */
  app: 'Home',
  ai: 'AI Assistant',

  /* Settings sub-pages */
  'api-keys': 'API Keys & Webhooks',
  'automations-config': 'Automations Config',
  'calendar-sync': 'Calendar Sync',
  'credit-notes': 'Credit Notes',
  'custom-fields': 'Custom Fields',
  'data-privacy': 'Data & Privacy',
  'document-defaults': 'Document Defaults',
  'email-templates': 'Email Templates',
  'org-chart': 'Org Chart',
  'payment-terms': 'Payment Terms',
  'cost-rates': 'Cost Rates',

  /* Finance / Reports sub-pages */
  'revenue-recognition': 'Revenue Recognition',
  'budget-vs-actual': 'Budget vs Actual',
  'crew-availability': 'Crew Availability',
  'equipment-utilization': 'Equipment Utilization',
  'win-rate': 'Win Rate',
  revenue: 'Revenue',
  profitability: 'Profitability',
  forecast: 'Forecast',
  funnel: 'Funnel',
  aging: 'Aging',
  wip: 'Work in Progress',

  /* Module sub-views */
  builder: 'Builder',
  board: 'Board',
  gantt: 'Gantt',
  workloads: 'Workloads',
  utilization: 'Utilization',
  schedule: 'Schedule',
  availability: 'Availability',
  onboarding: 'Onboarding',
  maintenance: 'Maintenance',
  bundles: 'Bundles',
  packing: 'Packing',
  scan: 'Scan',
  transfers: 'Transfers',
  timer: 'Timer',
  timesheets: 'Timesheets',
  pipeline: 'Pipeline',
  recurring: 'Recurring',
  new: 'New',
  export: 'Export',
  scenarios: 'Scenarios',
  forms: 'Lead Forms',
  history: 'History',
  routes: 'Routes',
  assets: 'Assets',

  /* Module names that need special formatting */
  'work-orders': 'Work Orders',
  'my-schedule': 'My Schedule',
  'my-tasks': 'My Tasks',
  'my-inbox': 'My Inbox',
  'my-documents': 'My Documents',
  'purchase-orders': 'Purchase Orders',

  /* Operations */
  'time-off': 'Time Off',
  fabrication: 'Fabrication',
  procurement: 'Procurement',
  rentals: 'Rentals',
  dispatch: 'Dispatch',
  logistics: 'Logistics',
  marketplace: 'Marketplace',
  compliance: 'Compliance',
};
