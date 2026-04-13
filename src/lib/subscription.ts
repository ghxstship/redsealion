import type { SubscriptionTier } from '@/types/database';

/**
 * Extends the DB-level SubscriptionTier with 'portal' for demo/preview contexts.
 * All downstream code should use AppTier when the portal tier may appear.
 */
export type AppTier = SubscriptionTier | 'portal';

export type FeatureKey =
  // All tiers (Portal) — core CRM + Project Management
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
  // Starter — CRM, sales, presentation
  | 'portfolio'
  | 'assets'
  | 'team'
  | 'templates'
  | 'terms'
  | 'export_docx'
  | 'export_pdf'
  | 'billing'
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
const featureRegistry: Record<FeatureKey, AppTier> = {
  // Portal tier — core CRM + project management (all tiers)
  proposals: 'portal',
  clients: 'portal',
  pipeline: 'portal',
  leads: 'portal',
  invoices: 'portal',
  reports: 'portal',
  projects: 'portal',
  tasks: 'portal',
  gantt: 'portal',
  roadmap: 'portal',
  files: 'portal',
  calendar: 'portal',

  // Starter tier — CRM, sales, presentation
  portfolio: 'starter',
  assets: 'starter',
  team: 'starter',
  templates: 'starter',
  terms: 'starter',
  export_docx: 'starter',
  export_pdf: 'starter',
  billing: 'starter',
  advancing: 'starter',

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

const tierRank: Record<AppTier, number> = {
  portal: -1,
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function getRequiredTier(feature: FeatureKey): AppTier {
  return featureRegistry[feature];
}

export function canAccessFeature(
  currentTier: AppTier,
  feature: FeatureKey
): boolean {
  const required = featureRegistry[feature];
  return tierRank[currentTier] >= tierRank[required];
}

export function tierMeetsMinimum(
  currentTier: AppTier,
  requiredTier: AppTier
): boolean {
  return tierRank[currentTier] >= tierRank[requiredTier];
}

export function getTierLabel(tier: AppTier): string {
  const labels: Record<AppTier, string> = {
    portal: 'Portal Demo',
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}
