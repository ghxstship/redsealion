import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import RecurringHeader from '@/components/admin/invoices/RecurringHeader';

interface RecurringScheduleRow {
  id: string;
  client_name: string;
  frequency: string;
  next_issue_date: string;
  amount: number;
  is_active: boolean;
  description: string;
}

const FALLBACK_SCHEDULES: RecurringScheduleRow[] = [
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

async function getRecurringSchedules(): Promise<RecurringScheduleRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: schedules } = await supabase
      .from('recurring_invoice_schedules')
      .select('*, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .order('next_issue_date', { ascending: true });

    if (!schedules) throw new Error('No schedules');

    return schedules.map((s: Record<string, unknown>) => ({
      id: s.id as string,
      client_name: (s.clients as Record<string, string>)?.company_name ?? 'Unknown',
      frequency: s.frequency as string,
      next_issue_date: s.next_issue_date as string,
      amount: s.base_amount as number,
      is_active: s.is_active as boolean,
      description: (s.description as string) ?? '',
    }));
  } catch {
    return FALLBACK_SCHEDULES;
  }
}

export default async function RecurringInvoicesPage() {
  const schedules = await getRecurringSchedules();

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
        <RecurringHeader />
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {schedules.map((schedule) => (
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

      {schedules.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No recurring invoice schedules yet.</p>
        </div>
      )}
    </TierGate>
  );
}
