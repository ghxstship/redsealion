import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import ChartContainer from '@/components/admin/reports/ChartContainer';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface RevenueRow {
  total: number;
  amount_paid: number;
  status: string;
  issue_date: string;
}

async function getRevenueData(): Promise<RevenueRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: invoices } = await supabase
      .from('invoices')
      .select('total, amount_paid, status, issue_date')
      .eq('organization_id', ctx.organizationId)
      .order('issue_date');

    return (invoices ?? []) as RevenueRow[];
  } catch {
    return [];
  }
}

export default async function RevenueReportPage() {
  const invoices = await getRevenueData();

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const outstanding = totalInvoiced - totalCollected;
  const overdueAmount = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((s, i) => s + (i.total - i.amount_paid), 0);

  // Group by month
  const monthMap = new Map<string, { invoiced: number; collected: number }>();
  for (const inv of invoices) {
    const d = new Date(inv.issue_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthMap.get(key) ?? { invoiced: 0, collected: 0 };
    entry.invoiced += inv.total;
    entry.collected += inv.amount_paid;
    monthMap.set(key, entry);
  }
  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      ...val,
    }));

  const maxMonthValue = Math.max(...months.map((m) => m.invoiced), 1);

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Revenue Trends</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Revenue Trends
      </h1>

      <div className="space-y-8">
        <MetricGrid
          metrics={[
            { label: 'Total Invoiced', value: formatCurrency(totalInvoiced) },
            { label: 'Collected', value: formatCurrency(totalCollected), changeType: 'positive' },
            { label: 'Outstanding', value: formatCurrency(outstanding), changeType: outstanding > 0 ? 'negative' : 'neutral' },
            { label: 'Overdue', value: formatCurrency(overdueAmount), changeType: overdueAmount > 0 ? 'negative' : 'neutral' },
          ]}
        />

        <ChartContainer title="Monthly Revenue" height={280}>
          <div className="flex items-end justify-between gap-2 h-full pb-8">
            {months.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-text-muted">
                  {formatCurrency(m.invoiced)}
                </span>
                <div className="w-full flex flex-col gap-0.5">
                  <div
                    className="w-full rounded-t bg-foreground/80 min-h-[2px]"
                    style={{ height: `${(m.invoiced / maxMonthValue) * 180}px` }}
                  />
                  <div
                    className="w-full rounded-b bg-green-500/60 min-h-[2px]"
                    style={{ height: `${(m.collected / maxMonthValue) * 180}px` }}
                  />
                </div>
                <span className="text-xs text-text-muted mt-1">{m.label}</span>
              </div>
            ))}
          </div>
        </ChartContainer>

        <div className="flex gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-foreground/80" />
            <span>Invoiced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/60" />
            <span>Collected</span>
          </div>
        </div>

        {/* Forecast vs Actual */}
        {months.length > 0 && (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Forecast vs. Actual by Month</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Month</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Invoiced</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Collected</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Collection Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {months.map((m) => {
                    const rate = m.invoiced > 0 ? (m.collected / m.invoiced) * 100 : 0;
                    const variance = m.collected - m.invoiced;
                    return (
                      <tr key={m.label} className="transition-colors hover:bg-bg-secondary/50">
                        <td className="px-6 py-3.5 text-sm font-medium text-foreground">{m.label}</td>
                        <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                          {formatCurrency(m.invoiced)}
                        </td>
                        <td className="px-6 py-3.5 text-right text-sm tabular-nums text-green-700">
                          {formatCurrency(m.collected)}
                        </td>
                        <td className={`px-6 py-3.5 text-right text-sm tabular-nums ${
                          rate >= 90 ? 'text-green-700' : rate >= 50 ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {rate.toFixed(0)}%
                        </td>
                        <td className={`px-6 py-3.5 text-right text-sm tabular-nums ${
                          variance >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TierGate>
  );
}
