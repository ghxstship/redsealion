import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import RecurringHeader from '@/components/admin/invoices/RecurringHeader';
import InvoiceHubTabs from '../../InvoiceHubTabs';
import PageHeader from '@/components/shared/PageHeader';

interface RecurringScheduleRow {
  id: string;
  client_name: string;
  frequency: string;
  next_issue_date: string;
  amount: number;
  is_active: boolean;
  description: string;
}



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
    return [];
  }
}

export default async function RecurringInvoicesPage() {
  const schedules = await getRecurringSchedules();

  return (
    <TierGate feature="recurring_invoices">
<PageHeader
        title="Recurring Invoices"
        subtitle="Manage automatic invoice generation schedules."
      >
        <RecurringHeader />
      </PageHeader>

      <InvoiceHubTabs />

      <div className="rounded-xl border border-border bg-background divide-y divide-border">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{schedule.client_name}</h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-bg-secondary text-text-muted'
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
        <EmptyState
          message="No recurring invoices configured yet"
          description="Create a recurring schedule to automatically generate invoices."
        />
      )}
    </TierGate>
  );
}
