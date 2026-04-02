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
  | 'payroll_export';

// Maps each feature to the minimum subscription tier required
const featureRegistry: Record<FeatureKey, SubscriptionTier> = {
  // Starter tier — CRM, sales, presentation
  proposals: 'starter',
  clients: 'starter',
  portfolio: 'starter',
  assets: 'starter',
  team: 'starter',
  templates: 'starter',
  terms: 'starter',
  pipeline: 'starter',
  invoices: 'starter',
  reports: 'starter',
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
  leads: 'starter',
  online_payments: 'professional',
  warehouse: 'enterprise',
  onboarding: 'professional',
  payroll_export: 'enterprise',
};

const tierRank: Record<SubscriptionTier, number> = {
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
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}
