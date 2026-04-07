import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore FlyteDeck features: interactive proposals, CRM, invoicing, time tracking, workload management, budgeting, profitability, integrations, and AI — built for experiential production.',
};

interface Feature {
  title: string;
  description: string;
}

interface FeatureCategory {
  name: string;
  tier: string;
  features: Feature[];
}

const categories: FeatureCategory[] = [
  {
    name: 'Proposals & Sales',
    tier: 'Starter and above',
    features: [
      {
        title: 'Interactive Proposal Builder',
        description:
          'Step-by-step builder with deliverables, add-ons, milestone gates, and instant preview so clients see exactly what you see.',
      },
      {
        title: 'Proposal Templates',
        description:
          'Save and reuse winning formats. Customize per client to speed up every new pitch.',
      },
      {
        title: 'Proposal Scenarios',
        description:
          'Present A/B pricing options that clients can compare side by side before approving.',
      },
      {
        title: 'Client Portal',
        description:
          'A branded portal where clients review proposals, approve phases, and track project progress.',
      },
      {
        title: 'Sales Pipeline',
        description:
          'Visual Kanban board with configurable deal stages, win probability, and revenue forecasting.',
      },
      {
        title: 'CRM & Contacts',
        description:
          'Centralized client profiles, full interaction history, and contact management across your team.',
      },
    ],
  },
  {
    name: 'Finance',
    tier: 'Starter and above',
    features: [
      {
        title: 'Invoicing',
        description:
          'Deposit, balance, change order, and final invoice types to match the way production billing works.',
      },
      {
        title: 'Recurring Billing',
        description:
          'Set up automated recurring invoice schedules for retainer clients and ongoing engagements.',
      },
      {
        title: 'Credit Notes',
        description:
          'Issue credits and manage adjustments without losing an audit trail.',
      },
      {
        title: 'Accounting Integration',
        description:
          'Connect to QuickBooks and Xero to push invoices and reconcile payment status.',
      },
      {
        title: 'Budget Tracking',
        description:
          'Compare planned vs actual spend with real-time burn charts across every project.',
      },
      {
        title: 'Profitability Analysis',
        description:
          'Per-project and per-client margin tracking so you know which work is worth pursuing.',
      },
    ],
  },
  {
    name: 'Operations',
    tier: 'Enterprise',
    features: [
      {
        title: 'Time Tracking',
        description:
          'One-click timer, weekly timesheets, and manager approvals tied directly to projects and budgets.',
      },
      {
        title: 'Workload Management',
        description:
          'Team allocation with utilization tracking to balance workloads across your crew.',
      },
      {
        title: 'Utilization Tracking',
        description:
          'See availability gaps before they become problems so you can plan hires or freelancers ahead of time.',
      },
      {
        title: 'Task Management',
        description:
          'Kanban boards, list views, and calendar views to keep production tasks on track.',
      },
      {
        title: 'Gantt Charts',
        description:
          'Visual timelines with dependency tracking for complex multi-phase productions.',
      },
      {
        title: 'Expense Management',
        description:
          'Submit, approve, and track project expenses with receipt capture and category tagging.',
      },
    ],
  },
  {
    name: 'Integrations & Automation',
    tier: 'Professional and above',
    features: [
      {
        title: 'CRM Integration',
        description:
          'Connect to Salesforce, HubSpot, and Pipedrive to keep your sales data consistent.',
      },
      {
        title: 'PM Integration',
        description:
          'Connect tasks with ClickUp, Asana, and Monday so nothing falls through the cracks.',
      },
      {
        title: 'Automations',
        description:
          'Trigger-based workflows that handle repetitive tasks like status updates, notifications, and assignments.',
      },
      {
        title: 'Webhooks',
        description:
          'Zapier-compatible endpoints for custom integrations with any tool in your stack.',
      },
      {
        title: 'Email Inbox',
        description:
          'Linked email threads on deals and projects so every conversation lives in context. Coming soon.',
      },
    ],
  },
  {
    name: 'Team & Administration',
    tier: 'Enterprise',
    features: [
      {
        title: 'People & HR',
        description:
          'Team directory, org chart, and employment details in one place.',
      },
      {
        title: 'Time Off Management',
        description:
          'Request, approve, and track PTO and holidays with calendar visibility for the whole team.',
      },
      {
        title: 'Custom Fields',
        description:
          'Add your own data fields to any entity to capture the information that matters to your workflow.',
      },
      {
        title: 'AI Assistant',
        description:
          'Proposal drafting, budget analysis, and smart suggestions powered by Claude.',
      },
      {
        title: 'Granular Permissions',
        description:
          'Role-based access control with per-resource permissions for full control over who sees what.',
      },
      {
        title: 'Audit Log',
        description:
          'A complete activity trail for compliance, accountability, and peace of mind.',
      },
    ],
  },
  {
    name: 'Platform',
    tier: 'Enterprise',
    features: [
      {
        title: 'SSO',
        description:
          'Single sign-on for enterprise security with support for SAML and OIDC providers. Coming soon.',
      },
      {
        title: 'White-Label Branding',
        description:
          'Custom logos, colors, and domains for all client-facing content.',
      },
      {
        title: 'Document Export',
        description:
          'Generate professional PDFs and DOCX files for proposals, invoices, and reports.',
      },
      {
        title: 'Asset Library',
        description:
          'A central repository for images, documents, and files with cross-referencing to terms and proposals.',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="px-8 py-16 lg:px-16">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Everything you need to run an experiential production company
        </h1>
        <p className="mt-4 text-lg text-zinc-500">
          Replace scattered spreadsheets, disconnected tools, and manual
          processes with one platform built for experiential production from
          pitch to wrap.
        </p>
      </div>

      {/* Feature Categories */}
      <div className="mx-auto mt-20 max-w-6xl space-y-20">
        {categories.map((category) => (
          <section key={category.name}>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                {category.name}
              </h2>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {category.tier}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-zinc-200 p-6"
                >
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mx-auto mt-24 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          See which plan is right for your team
        </h2>
        <div className="mt-6">
          <Link
            href="/pricing"
            className="inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
