/**
 * Pricing tier and feature comparison data for the pricing page.
 *
 * @module app/(marketing)/pricing/_data
 */

/* ─── Pricing Tiers ─────────────────────────────────────── */

export const tiers = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'For freelancers and small teams getting started.',
    features: [
      'Up to 10 proposals per month',
      '2 team members',
      'Basic templates & terms library',
      'Sales pipeline (Kanban)',
      'Client portal',
      'Invoicing (deposit, balance, final)',
      'Basic reports & analytics',
      'PDF & DOCX export',
      'Email support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing production companies.',
    features: [
      'Unlimited proposals',
      '10 team members',
      'Custom templates & branding',
      'Multi-pipeline support',
      'Advanced CRM with client interactions',
      'Recurring invoices & credit notes',
      'Custom reports & analytics',
      'Integrations (Salesforce, HubSpot, QuickBooks, Xero)',
      'Automations & webhooks',
      'Priority support',
    ],
    cta: 'Get Started',
    href: '/signup',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with complex needs.',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Time tracking & timesheets',
      'Workload management & utilization tracking',
      'Budgeting & profitability tracking',
      'Expense management',
      'People & HR (time off, org chart)',
      'Task management (Kanban, Gantt, Calendar)',
      'AI assistant',
      'Custom fields & scenarios',
      'SSO & advanced security (coming soon)',
      'Audit log & granular permissions',
      'Dedicated account manager',
      'SLA & uptime guarantees',
    ],
    cta: 'Contact Sales',
    href: '#',
    featured: false,
  },
];

/* ─── Feature Comparison ────────────────────────────────── */

export type FeatureValue = string | boolean;

export interface Feature {
  name: string;
  starter: FeatureValue;
  professional: FeatureValue;
  enterprise: FeatureValue;
}

export interface Category {
  name: string;
  features: Feature[];
}

export const comparisonData: Category[] = [
  {
    name: 'Proposals & Sales',
    features: [
      { name: 'Interactive proposal builder', starter: true, professional: true, enterprise: true },
      { name: 'Proposal templates', starter: 'Basic', professional: 'Custom + branding', enterprise: 'Custom + branding' },
      { name: 'Client portal', starter: true, professional: 'With activity tracking', enterprise: 'Full (approvals + files)' },
      { name: 'Sales pipeline', starter: 'Single', professional: 'Multi-pipeline', enterprise: 'Multi-pipeline' },
      { name: 'CRM & contacts', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
      { name: 'Proposal scenarios', starter: false, professional: false, enterprise: true },
      { name: 'E-signatures', starter: true, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Finance',
    features: [
      { name: 'Invoicing', starter: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
      { name: 'Recurring invoices', starter: false, professional: true, enterprise: true },
      { name: 'Credit notes', starter: false, professional: true, enterprise: true },
      { name: 'QuickBooks/Xero integration', starter: false, professional: true, enterprise: true },
      { name: 'Budgeting & burn tracking', starter: false, professional: false, enterprise: true },
      { name: 'Profitability analysis', starter: false, professional: false, enterprise: true },
      { name: 'Expense management', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Operations',
    features: [
      { name: 'Time tracking', starter: false, professional: false, enterprise: true },
      { name: 'Workload management', starter: false, professional: false, enterprise: true },
      { name: 'Utilization tracking', starter: false, professional: false, enterprise: true },
      { name: 'Task management', starter: false, professional: false, enterprise: true },
      { name: 'Gantt charts', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Integrations & Automation',
    features: [
      { name: 'CRM integration (Salesforce, HubSpot)', starter: false, professional: true, enterprise: true },
      { name: 'PM integration (ClickUp, Asana)', starter: false, professional: true, enterprise: true },
      { name: 'Automations', starter: false, professional: true, enterprise: true },
      { name: 'Webhooks (Zapier)', starter: false, professional: true, enterprise: true },
      { name: 'API access', starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Team & Security',
    features: [
      { name: 'Team members', starter: '2', professional: '10', enterprise: 'Unlimited' },
      { name: 'Custom fields', starter: false, professional: false, enterprise: true },
      { name: 'AI assistant', starter: false, professional: false, enterprise: true },
      { name: 'People & HR', starter: false, professional: false, enterprise: true },
      { name: 'SSO (coming soon)', starter: false, professional: false, enterprise: true },
      { name: 'Audit log', starter: false, professional: false, enterprise: true },
      { name: 'Granular permissions', starter: false, professional: false, enterprise: true },
      { name: 'SLA guarantee', starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Email support', starter: true, professional: true, enterprise: true },
      { name: 'Priority support', starter: false, professional: true, enterprise: true },
      { name: 'Dedicated account manager', starter: false, professional: false, enterprise: true },
      { name: 'Onboarding & training', starter: false, professional: false, enterprise: true },
    ],
  },
];
