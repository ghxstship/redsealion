import type { SubscriptionTier } from '@/types/database';

export type FeatureKey =
  // Starter (CRM / Sales / Presentation)
  | 'proposals'
  | 'clients'
  | 'portfolio'
  | 'assets'
  | 'team'
  | 'templates'
  | 'terms'
  | 'pipeline'
  | 'invoices'
  | 'reports'
  | 'export_docx'
  | 'export_pdf'
  // Professional (Integration Hub)
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
  // Enterprise (Standalone All-in-One)
  | 'time_tracking'
  | 'resource_scheduling'
  | 'budgets'
  | 'profitability'
  | 'expenses'
  | 'people_hr'
  | 'time_off'
  | 'org_chart'
  | 'tasks'
  | 'gantt'
  | 'custom_fields'
  | 'scenarios'
  | 'ai_assistant'
  | 'audit_log'
  | 'permissions'
  | 'sso'
  | 'billing'
  // Feature parity additions
  | 'crew'
  | 'equipment'
  | 'esign'
  | 'calendar'
  | 'leads'
  | 'online_payments'
  | 'warehouse'
  | 'onboarding'
  | 'payroll_export'
  // Feature parity — Tiers 2 & 3
  | 'work_orders'
  | 'job_photos'
  | 'deposit_payments'
  | 'ai_drafting'
  | 'crew_ratings'
  | 'referral_program'
  | 'email_campaigns'
  | 'review_requests'
  // Production Advancing
  | 'advancing'
  | 'advancing_collection'
  // Events, Activations & Locations
  | 'events'
  | 'activations'
  | 'locations';

// Maps each feature to the minimum subscription tier required
const featureRegistry: Record<FeatureKey, SubscriptionTier> = {
  // Portal tier — read-only demo experience
  proposals: 'portal',
  clients: 'portal',
  pipeline: 'portal',
  leads: 'portal',
  invoices: 'portal',
  reports: 'portal',

  // Starter tier — CRM, sales, presentation
  portfolio: 'starter',
  assets: 'starter',
  team: 'starter',
  templates: 'starter',
  terms: 'starter',
  export_docx: 'starter',
  export_pdf: 'starter',

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

  // Enterprise tier — full standalone
  time_tracking: 'enterprise',
  resource_scheduling: 'enterprise',
  budgets: 'enterprise',
  profitability: 'enterprise',
  expenses: 'enterprise',
  people_hr: 'enterprise',
  time_off: 'enterprise',
  org_chart: 'enterprise',
  tasks: 'enterprise',
  gantt: 'enterprise',
  custom_fields: 'enterprise',
  scenarios: 'enterprise',
  ai_assistant: 'enterprise',
  audit_log: 'enterprise',
  permissions: 'enterprise',
  sso: 'enterprise',
  billing: 'starter',
  // Feature parity additions
  crew: 'professional',
  equipment: 'professional',
  esign: 'professional',
  calendar: 'professional',
  online_payments: 'professional',
  warehouse: 'enterprise',
  onboarding: 'professional',
  payroll_export: 'enterprise',
  // Feature parity — Tiers 2 & 3
  work_orders: 'enterprise',
  job_photos: 'professional',
  deposit_payments: 'professional',
  ai_drafting: 'enterprise',
  crew_ratings: 'professional',
  referral_program: 'professional',
  email_campaigns: 'professional',
  review_requests: 'professional',
  // Production Advancing
  advancing: 'starter',
  advancing_collection: 'professional',
  // Events, Activations & Locations
  events: 'professional',
  activations: 'professional',
  locations: 'professional',
};

const tierRank: Record<SubscriptionTier, number> = {
  portal: -1,
  free: 0,
  starter: 1,
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
    portal: 'Portal Demo',
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}
