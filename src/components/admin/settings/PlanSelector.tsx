'use client';

import { Check } from 'lucide-react';

import { useState } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { tierMeetsMinimum } from '@/lib/subscription';
import type { SubscriptionTier } from '@/types/database';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

interface Plan {
  name: string;
  tier: SubscriptionTier;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Free',
    tier: 'free',
    price: '$0',
    period: '/month',
    features: [
      'Proposals & Clients',
      'Invoicing & Pipeline',
      'Projects, Tasks & Gantt',
      'Calendar & Files',
      'Reports & Roadmap',
    ],
  },
  {
    name: 'Starter',
    tier: 'starter',
    price: '$49',
    period: '/month',
    features: [
      'Everything in Free',
      'Portfolio & Assets',
      'Team Management',
      'Templates & Terms',
      'PDF & DOCX Export',
      'Advancing',
    ],
  },
  {
    name: 'Professional',
    tier: 'professional',
    price: '$149',
    period: '/month',
    highlighted: true,
    features: [
      'Everything in Starter',
      'CRM & PM Integrations',
      'Automations & Webhooks',
      'Multi-Pipeline & Custom Reports',
      'Recurring Invoices & Credit Notes',
      'Crew & Equipment',
    ],
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: '$399',
    period: '/month',
    features: [
      'Everything in Professional',
      'Time Tracking & Budgets',
      'Resource Scheduling',
      'Profitability & Expenses',
      'People / HR & Org Chart',
      'AI Assistant & AI Drafting',
      'Audit Log, SSO & Permissions',
    ],
  },
];

export default function PlanSelector() {
  const { tier: currentTier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(tier: string) {
    setLoadingTier(tier);
    setError(null);

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isLoading = loadingTier === plan.tier;
          const isUpgrade = !isCurrent && tierMeetsMinimum(plan.tier, currentTier) && plan.tier !== currentTier;
          const isDowngrade = !isCurrent && !tierMeetsMinimum(plan.tier, currentTier);
          return (
            <div
              key={plan.tier}
              className={`rounded-xl border bg-background px-6 py-6 ${
                isCurrent
                  ? 'border-foreground/50 ring-1 ring-foreground/20 shadow-sm'
                  : plan.highlighted
                    ? 'border-foreground shadow-md'
                    : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="ml-1 text-sm text-text-secondary">{plan.period}</span>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'border border-border bg-bg-secondary text-text-secondary cursor-default'
                    : isDowngrade
                      ? 'border border-border bg-background text-text-secondary hover:bg-bg-secondary'
                      : plan.highlighted
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'border border-border bg-background text-foreground hover:bg-bg-secondary'
                }`}
                disabled={isCurrent || isLoading}
                onClick={() => !isCurrent && handleUpgrade(plan.tier)}
              >
                {isCurrent
                  ? 'Current Plan'
                  : isLoading
                    ? 'Redirecting…'
                    : isDowngrade
                      ? 'Downgrade'
                      : 'Upgrade'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
