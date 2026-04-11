import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge, { MILEAGE_STATUS_COLORS } from '@/components/ui/StatusBadge';

interface MileageStats {
  milesThisMonth: number;
  rate: number;
  reimbursementDue: number;
  entries: Array<{
    id: string;
    origin: string;
    destination: string;
    distance_miles: number;
    amount: number;
    trip_date: string;
    status: string;
  }>;
}

async function getMileageData(): Promise<MileageStats> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { milesThisMonth: 0, rate: 0.70, reimbursementDue: 0, entries: [] };

    // Get org mileage rate
    const { data: org } = await supabase
      .from('organizations')
      .select('mileage_rate')
      .eq('id', ctx.organizationId)
      .single();

    const rate = (org?.mileage_rate as number) ?? 0.70;

    // Get mileage entries
    const { data: entries } = await supabase
      .from('mileage_entries')
      .select('id, origin, destination, distance_miles, amount, trip_date, status')
      .eq('organization_id', ctx.organizationId)
      .order('trip_date', { ascending: false })
      .limit(100);

    const rows = entries ?? [];

    // Calculate this month's totals
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const thisMonthEntries = rows.filter((e) => e.trip_date >= monthStart);
    const milesThisMonth = thisMonthEntries.reduce((s, e) => s + ((e.distance_miles as number) ?? 0), 0);
    const reimbursementDue = rows
      .filter((e) => e.status === 'approved')
      .reduce((s, e) => s + ((e.amount as number) ?? 0), 0);

    return {
      milesThisMonth,
      rate,
      reimbursementDue,
      entries: rows.map((e) => ({
        id: e.id as string,
        origin: e.origin as string,
        destination: e.destination as string,
        distance_miles: e.distance_miles as number,
        amount: e.amount as number,
        trip_date: e.trip_date as string,
        status: e.status as string,
      })),
    };
  } catch {
    return { milesThisMonth: 0, rate: 0.70, reimbursementDue: 0, entries: [] };
  }
}

export default async function MileagePage() {
  const data = await getMileageData();

  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Mileage Tracking"
        subtitle="Log and reimburse mileage for business travel."
      >
        <Link
          href="/app/expenses/mileage/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          New Mileage
        </Link>
      </PageHeader>

      <ExpensesHubTabs />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Miles This Month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {data.milesThisMonth.toFixed(1)}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Rate / Mile</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            ${data.rate.toFixed(2)}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Reimbursement Due</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(data.reimbursementDue)}
          </p>
        </Card>
      </div>

      {data.entries.length > 0 ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">To</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Miles</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{entry.trip_date}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground">{entry.origin}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground">{entry.destination}</td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{entry.distance_miles}</td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums font-medium text-foreground">{formatCurrency(entry.amount)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={entry.status} colorMap={MILEAGE_STATUS_COLORS} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          message="No mileage entries yet"
          description="Log business travel mileage for reimbursement. Each entry can be attached to a project or client."
        />
      )}
    </TierGate>
  );
}
