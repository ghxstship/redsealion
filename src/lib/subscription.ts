import type { SubscriptionTier } from '@/types/database';

/**
 * Subscription tier gating — SSOT.
 *
 * Tier hierarchy (ascending):
 *   Access (0) — free for life, core CRM + project management
 *   Core (1) — CRM, sales, presentation
 *   Professional (2) — integrations + advanced workflows
 *   Enterprise (3) — full standalone platform
 */

export type FeatureKey =
  // Access tier — core CRM + Project Management (free for life)
  | 'proposals'
  | 'clients'
  | 'pipeline'
  | 'leads'
  | 'invoices'
  | 'reports'
  | 'projects'
  | 'tasks'
  | 'gantt'
  | 'roadmap'
  | 'files'
  | 'calendar'
  | 'billing'
  // Core — CRM, sales, presentation
  | 'portfolio'
  | 'assets'
  | 'team'
  | 'templates'
  | 'terms'
  | 'export_docx'
  | 'export_pdf'
  | 'advancing'
  // Professional — integrations + advanced workflows
  | 'integrations'
  | 'crm_sync'
  | 'accounting_sync'
  | 'pm_sync'
  | 'automations'
  | 'webhooks'
  | 'email_inbox'
  | 'multi_pipeline'
  | 'custom_reports'
  | 'recurring_invoices'
  | 'credit_notes'
  | 'crew'
  | 'equipment'
  | 'esign'
  | 'online_payments'
  | 'onboarding'
  | 'advancing_collection'
  | 'events'
  | 'activations'
  | 'locations'
  | 'compliance'
  | 'job_photos'
  | 'deposit_payments'
  | 'crew_ratings'
  | 'referral_program'
  | 'email_campaigns'
  | 'review_requests'
  // Enterprise — full standalone
  | 'time_tracking'
  | 'resource_scheduling'
  | 'budgets'
  | 'profitability'
  | 'expenses'
  | 'people_hr'
  | 'time_off'
  | 'org_chart'
  | 'custom_fields'
  | 'scenarios'
  | 'ai_assistant'
  | 'audit_log'
  | 'permissions'
  | 'sso'
  | 'warehouse'
  | 'payroll_export'
  | 'work_orders'
  | 'marketplace'
  | 'ai_drafting'
  | 'logistics'
  | 'procurement';

// Maps each feature to the minimum subscription tier required
const featureRegistry: Record<FeatureKey, SubscriptionTier> = {
  // Access tier — core CRM + project management (free for life)
  proposals: 'access',
  clients: 'access',
  pipeline: 'access',
  leads: 'access',
  invoices: 'access',
  reports: 'access',
  projects: 'access',
  tasks: 'access',
  gantt: 'access',
  roadmap: 'access',
  files: 'access',
  calendar: 'access',
  billing: 'access',

  // Core tier — CRM, sales, presentation
  portfolio: 'core',
  assets: 'core',
  team: 'core',
  templates: 'core',
  terms: 'core',
  export_docx: 'core',
  export_pdf: 'core',
  advancing: 'core',

  // Professional tier — integrations + advanced workflows
  integrations: 'professional',
  crm_sync: 'professional',
  accounting_sync: 'professional',
  pm_sync: 'professional',
  automations: 'professional',
  webhooks: 'professional',
  email_inbox: 'professional',
  multi_pipeline: 'professional',
  custom_reports: 'professional',
  recurring_invoices: 'professional',
  credit_notes: 'professional',
  crew: 'professional',
  equipment: 'professional',
  esign: 'professional',
  online_payments: 'professional',
  onboarding: 'professional',
  advancing_collection: 'professional',
  events: 'professional',
  activations: 'professional',
  locations: 'professional',
  compliance: 'professional',
  job_photos: 'professional',
  deposit_payments: 'professional',
  crew_ratings: 'professional',
  referral_program: 'professional',
  email_campaigns: 'professional',
  review_requests: 'professional',

  // Enterprise tier — full standalone
  time_tracking: 'enterprise',
  resource_scheduling: 'enterprise',
  budgets: 'enterprise',
  profitability: 'enterprise',
  expenses: 'enterprise',
  people_hr: 'enterprise',
  time_off: 'enterprise',
  org_chart: 'enterprise',
  custom_fields: 'enterprise',
  scenarios: 'enterprise',
  ai_assistant: 'enterprise',
  audit_log: 'enterprise',
  permissions: 'enterprise',
  sso: 'enterprise',
  warehouse: 'enterprise',
  payroll_export: 'enterprise',
  work_orders: 'enterprise',
  marketplace: 'enterprise',
  ai_drafting: 'enterprise',
  logistics: 'enterprise',
  procurement: 'enterprise',
};

const tierRank: Record<SubscriptionTier, number> = {
  access: 0,
  core: 1,
  professional: 2,
  enterprise: 3,
};

export function getRequiredTier(feature: FeatureKey): SubscriptionTier {
  return featureRegistry[feature];
}

export function canAccessFeature(
  currentTier: SubscriptionTier,
  feature: FeatureKey
): boolean {
  const required = featureRegistry[feature];
  return tierRank[currentTier] >= tierRank[required];
}

export function tierMeetsMinimum(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return tierRank[currentTier] >= tierRank[requiredTier];
}

export function getTierLabel(tier: SubscriptionTier): string {
  const labels: Record<SubscriptionTier, string> = {
    access: 'Access',
    core: 'Core',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}
