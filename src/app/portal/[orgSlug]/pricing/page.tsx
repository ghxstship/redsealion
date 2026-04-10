import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { IconCheck } from '@/components/ui/Icons';

interface PricingPageProps {
  params: Promise<{ orgSlug: string }>;
}

const plans = [
  {
    name: 'Starter',
    tier: 'starter',
    price: '$49',
    period: '/month',
    tagline: 'Perfect for solo operators and small teams',
    features: [
      'Proposals & Clients',
      'Invoicing & Pipeline',
      'Portfolio & Asset Library',
      'Team Management',
      'PDF & DOCX Export',
      'Lead Capture Forms',
      'Terms & Contracts',
    ],
  },
  {
    name: 'Professional',
    tier: 'professional',
    price: '$149',
    period: '/month',
    tagline: 'For growing agencies that need integrations',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'CRM & PM Integrations',
      'Automations & Webhooks',
      'Multi-Pipeline & Custom Reports',
      'Recurring Invoices & Credit Notes',
      'Equipment & Crew Management',
      'Calendar & e-Signatures',
      'Email Inbox & Campaigns',
    ],
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: '$399',
    period: '/month',
    tagline: 'Full-featured standalone platform',
    features: [
      'Everything in Professional',
      'Time Tracking & Budgets',
      'Resource Scheduling & Gantt',
      'Profitability Analysis',
      'Expense Management',
      'People / HR & Org Chart',
      'AI Assistant & AI Drafting',
      'Audit Log, SSO & Permissions',
      'Warehouse & Dispatch',
      'Custom Fields & Scenarios',
    ],
  },
];

export default async function PricingPage({ params }: PricingPageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Ready to take flight?
        </h1>
        <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
          Choose the plan that fits your production workflow. All plans include a
          <span className="font-semibold text-foreground"> 14-day free trial</span> —
          no credit card required.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative flex flex-col rounded-2xl border bg-white px-8 py-8 ${
                plan.highlighted
                  ? 'border-foreground shadow-lg ring-1 ring-foreground/10'
                  : 'border-border'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}

              <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="ml-1 text-sm text-text-secondary">{plan.period}</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-text-secondary"
                  >
                    <IconCheck
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                      strokeWidth={2}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=${plan.tier}`}
                className={`mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors text-center block ${
                  plan.highlighted
                    ? 'bg-foreground text-white hover:bg-foreground/90'
                    : 'border border-border bg-white text-foreground hover:bg-bg-secondary'
                }`}
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ / Trust */}
        <div className="mt-16 text-center">
          <p className="text-sm text-text-muted">
            Questions?{' '}
            <Link
              href={`/portal/${orgSlug}/request`}
              className="text-foreground font-medium hover:underline"
            >
              Contact our sales team
            </Link>{' '}for
            a personalized demo or custom enterprise pricing.
          </p>
          <div className="mt-8 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <IconCheck className="text-green-500" size={16} strokeWidth={1.5} />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <IconCheck className="text-green-500" size={16} strokeWidth={1.5} />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <IconCheck className="text-green-500" size={16} strokeWidth={1.5} />
              Free migration support
            </div>
          </div>
        </div>

        {/* Return to demo */}
        <div className="mt-12 text-center">
          <Link
            href={`/portal/${orgSlug}/app`}
            className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            ← Back to demo
          </Link>
        </div>
      </div>
    </div>
  );
}
