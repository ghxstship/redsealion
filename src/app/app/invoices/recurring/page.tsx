'use client';

import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';

const SAMPLE_SCHEDULES = [
  {
    id: '1',
    client_name: 'ACME Corp',
    frequency: 'monthly',
    next_issue_date: '2026-04-01',
    amount: 5000,
    is_active: true,
    description: 'Retainer - ongoing design services',
  },
  {
    id: '2',
    client_name: 'TechStart Inc',
    frequency: 'quarterly',
    next_issue_date: '2026-07-01',
    amount: 15000,
    is_active: true,
    description: 'Quarterly maintenance and storage',
  },
  {
    id: '3',
    client_name: 'Metro Events',
    frequency: 'monthly',
    next_issue_date: '2026-04-15',
    amount: 2500,
    is_active: false,
    description: 'Monthly equipment rental',
  },
];

function formatFrequency(freq: string): string {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
  };
  return labels[freq] ?? freq;
}

export default function RecurringInvoicesPage() {
  return (
    <TierGate feature="recurring_invoices">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Recurring Invoices
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage automatic invoice generation schedules.
          </p>
        </div>
        <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          New Schedule
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {SAMPLE_SCHEDULES.map((schedule) => (
          <div key={schedule.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{schedule.client_name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {schedule.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">{schedule.description}</p>
              <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
                <span>{formatFrequency(schedule.frequency)}</span>
                <span>{formatCurrency(schedule.amount)} per cycle</span>
                <span>Next: {schedule.next_issue_date}</span>
              </div>
            </div>
            <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors">
              Edit
            </button>
          </div>
        ))}
      </div>
    </TierGate>
  );
}
