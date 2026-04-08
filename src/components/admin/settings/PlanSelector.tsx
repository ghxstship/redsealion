'use client';

import { Check } from 'lucide-react';

import { useState } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import type { SubscriptionTier } from '@/types/database';
import Alert from '@/components/ui/Alert';

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
    name: 'Starter',
    tier: 'starter',
    price: '$49',
    period: '/month',
    features: [
      'Proposals & Clients',
      'Invoicing & Pipeline',
      'Portfolio & Assets',
      'Team Management',
      'PDF & DOCX Export',
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
      'Tasks, Gantt & Kanban',
      'AI Assistant',
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const isLoading = loadingTier === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`rounded-xl border bg-background px-6 py-6 ${
                plan.highlighted
                  ? 'border-foreground shadow-md'
                  : 'border-border'
              }`}
            >
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
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

              <button
                className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'border border-border bg-bg-secondary text-text-secondary cursor-default'
                    : plan.highlighted
                      ? 'bg-foreground text-white hover:bg-foreground/90'
                      : 'border border-border bg-background text-foreground hover:bg-bg-secondary'
                }`}
                disabled={isCurrent || isLoading}
                onClick={() => !isCurrent && handleUpgrade(plan.tier)}
              >
                {isCurrent
                  ? 'Current Plan'
                  : isLoading
                    ? 'Redirecting…'
                    : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
