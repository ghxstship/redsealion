/**
 * Pricing tier and feature comparison data for the pricing page.
 *
 * @module app/(marketing)/pricing/_data
 */

/* ─── Pricing Tiers ─────────────────────────────────────── */

export const tiers = [
  {
    name: 'Core',
    price: '$49',
    priceAnnual: '$39',
    period: '/mo',
    description: 'For freelancers and small teams getting started.',
    features: [
      'Up to 10 proposals per month',
      '2 team members',
      'Project management (tasks, goals, roadmap, Gantt)',
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
    priceAnnual: '$119',
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
    priceAnnual: 'Custom',
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
      'AI assistant',
      'Custom fields & scenarios',
      'SSO & advanced security (coming soon)',
      'Audit log & granular permissions',
      'Dedicated account manager',
      'SLA & uptime guarantees',
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@flytedeck.io?subject=FlyteDeck%20Enterprise%20Inquiry',
    featured: false,
  },
];

/* ─── Feature Comparison ────────────────────────────────── */

export type FeatureValue = string | boolean;

interface Feature {
  name: string;
  core: FeatureValue;
  professional: FeatureValue;
  enterprise: FeatureValue;
}

interface Category {
  name: string;
  features: Feature[];
}

export const comparisonData: Category[] = [
  {
    name: 'Proposals & Sales',
    features: [
      { name: 'Interactive proposal builder', core: true, professional: true, enterprise: true },
      { name: 'Proposal templates', core: 'Basic', professional: 'Custom + branding', enterprise: 'Custom + branding' },
      { name: 'Client portal', core: true, professional: 'With activity tracking', enterprise: 'Full (approvals + files)' },
      { name: 'Sales pipeline', core: 'Single', professional: 'Multi-pipeline', enterprise: 'Multi-pipeline' },
      { name: 'CRM & contacts', core: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
      { name: 'Proposal scenarios', core: false, professional: false, enterprise: true },
      { name: 'E-signatures', core: true, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Finance',
    features: [
      { name: 'Invoicing', core: 'Basic', professional: 'Advanced', enterprise: 'Advanced' },
      { name: 'Recurring invoices', core: false, professional: true, enterprise: true },
      { name: 'Credit notes', core: false, professional: true, enterprise: true },
      { name: 'QuickBooks/Xero integration', core: false, professional: true, enterprise: true },
      { name: 'Budgeting & burn tracking', core: false, professional: false, enterprise: true },
      { name: 'Profitability analysis', core: false, professional: false, enterprise: true },
      { name: 'Expense management', core: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Project Management',
    features: [
      { name: 'Projects', core: true, professional: true, enterprise: true },
      { name: 'Task management', core: true, professional: true, enterprise: true },
      { name: 'Goals', core: true, professional: true, enterprise: true },
      { name: 'Roadmap', core: true, professional: true, enterprise: true },
      { name: 'Gantt charts', core: true, professional: true, enterprise: true },
      { name: 'Files & documents', core: true, professional: true, enterprise: true },
      { name: 'Calendar & scheduling', core: true, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Operations',
    features: [
      { name: 'Time tracking', core: false, professional: false, enterprise: true },
      { name: 'Workload management', core: false, professional: false, enterprise: true },
      { name: 'Utilization tracking', core: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Integrations & Automation',
    features: [
      { name: 'CRM integration (Salesforce, HubSpot)', core: false, professional: true, enterprise: true },
      { name: 'PM integration (ClickUp, Asana)', core: false, professional: true, enterprise: true },
      { name: 'Automations', core: false, professional: true, enterprise: true },
      { name: 'Webhooks (Zapier)', core: false, professional: true, enterprise: true },
      { name: 'API access', core: false, professional: true, enterprise: true },
    ],
  },
  {
    name: 'Team & Security',
    features: [
      { name: 'Team members', core: '2', professional: '10', enterprise: 'Unlimited' },
      { name: 'Custom fields', core: false, professional: false, enterprise: true },
      { name: 'AI assistant', core: false, professional: false, enterprise: true },
      { name: 'People & HR', core: false, professional: false, enterprise: true },
      { name: 'SSO (coming soon)', core: false, professional: false, enterprise: true },
      { name: 'Audit log', core: false, professional: false, enterprise: true },
      { name: 'Granular permissions', core: false, professional: false, enterprise: true },
      { name: 'SLA guarantee', core: false, professional: false, enterprise: true },
    ],
  },
  {
    name: 'Support',
    features: [
      { name: 'Email support', core: true, professional: true, enterprise: true },
      { name: 'Priority support', core: false, professional: true, enterprise: true },
      { name: 'Dedicated account manager', core: false, professional: false, enterprise: true },
      { name: 'Onboarding & training', core: false, professional: false, enterprise: true },
    ],
  },
];
