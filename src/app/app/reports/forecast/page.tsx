import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import ChartContainer from '@/components/admin/reports/ChartContainer';
import type { DealStage } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface ForecastDeal {
  deal_value: number;
  probability: number;
  stage: DealStage;
  expected_close_date: string | null;
  created_at: string;
  won_date: string | null;
  title: string;
  client_name: string;
}

async function getForecastData(): Promise<ForecastDeal[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: deals } = await supabase
      .from('deals')
      .select('deal_value, probability, stage, expected_close_date, created_at, won_date, title, clients(company_name)')
      .eq('organization_id', ctx.organizationId);

    if (!deals) return [];

    return deals.map((d: Record<string, unknown>) => ({
      ...d,
      client_name: (d.clients as Record<string, string>)?.company_name ?? 'Unknown',
    })) as ForecastDeal[];
  } catch {
    return [];
  }
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
  return new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default async function ForecastReportPage() {
  const deals = await getForecastData();

  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  // Active pipeline (not lost/on_hold)
  const activeDeals = deals.filter(
    (d) => d.stage !== 'lost' && d.stage !== 'on_hold' && d.stage !== 'contract_signed'
  );

  // Won deals for actual revenue
  const wonDeals = deals.filter((d) => d.stage === 'contract_signed');

  // Forecast categories
  const bestCase = activeDeals.reduce((s, d) => s + d.deal_value, 0);
  const committed = activeDeals
    .filter((d) => d.probability >= 75)
    .reduce((s, d) => s + d.deal_value, 0);
  const weighted = activeDeals.reduce(
    (s, d) => s + d.deal_value * (d.probability / 100),
    0
  );
  const closedRevenue = wonDeals.reduce((s, d) => s + d.deal_value, 0);

  // Monthly forecast breakdown (next 6 months)
  const monthlyForecast: Array<{
    key: string;
    label: string;
    committed: number;
    weighted: number;
    bestCase: number;
    actual: number;
  }> = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = getMonthKey(d);
    const label = getMonthLabel(key);

    const monthActual = wonDeals
      .filter((deal) => deal.won_date && getMonthKey(new Date(deal.won_date)) === key)
      .reduce((s, deal) => s + deal.deal_value, 0);

    const monthDeals = activeDeals.filter(
      (deal) => deal.expected_close_date && getMonthKey(new Date(deal.expected_close_date)) === key
    );

    monthlyForecast.push({
      key,
      label,
      committed: monthDeals
        .filter((deal) => deal.probability >= 75)
        .reduce((s, deal) => s + deal.deal_value, 0),
      weighted: monthDeals.reduce(
        (s, deal) => s + deal.deal_value * (deal.probability / 100),
        0
      ),
      bestCase: monthDeals.reduce((s, deal) => s + deal.deal_value, 0),
      actual: monthActual,
    });
  }

  const maxBarValue = Math.max(
    ...monthlyForecast.map((m) => Math.max(m.bestCase, m.actual)),
    1
  );

  // Top deals by weighted value
  const topDeals = [...activeDeals]
    .sort((a, b) => b.deal_value * (b.probability / 100) - a.deal_value * (a.probability / 100))
    .slice(0, 8);

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Sales Forecast</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Sales Forecast
      </h1>

      <div className="space-y-8">
        <MetricGrid
          metrics={[
            { label: 'Best Case', value: formatCurrency(bestCase) },
            { label: 'Committed (≥75%)', value: formatCurrency(committed), changeType: 'positive' },
            { label: 'Weighted Pipeline', value: formatCurrency(weighted) },
            { label: 'Closed Revenue', value: formatCurrency(closedRevenue), changeType: 'positive' },
          ]}
        />

        <ChartContainer title="Monthly Revenue Forecast" height={280}>
          <div className="flex items-end justify-between gap-2 h-full pb-8">
            {monthlyForecast.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-text-muted">
                  {formatCurrency(m.weighted)}
                </span>
                <div className="w-full flex flex-col gap-0.5 items-center">
                  {m.actual > 0 && (
                    <div
                      className="w-full rounded-t bg-green-500/70 min-h-[2px]"
                      style={{ height: `${(m.actual / maxBarValue) * 200}px` }}
                    />
                  )}
                  <div
                    className="w-full bg-foreground/20 min-h-[2px]"
                    style={{ height: `${(m.bestCase / maxBarValue) * 200}px` }}
                  />
                  <div
                    className="w-full rounded-b bg-foreground/60 min-h-[2px]"
                    style={{ height: `${(m.committed / maxBarValue) * 200}px` }}
                  />
                </div>
                <span className="text-xs text-text-muted mt-1">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </ChartContainer>

        <div className="flex gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500/70" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-foreground/60" />
            <span>Committed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-foreground/20" />
            <span>Best Case</span>
          </div>
        </div>

        {/* Top Deals Table */}
        {topDeals.length > 0 && (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                Top Pipeline Deals by Weighted Value
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Deal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Client</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Prob.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Weighted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topDeals.map((deal) => (
                    <tr key={deal.title} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{deal.title}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{deal.client_name}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                        {formatCurrency(deal.deal_value)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-text-muted">
                        {deal.probability}%
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums font-medium text-foreground">
                        {formatCurrency(deal.deal_value * (deal.probability / 100))}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm text-text-muted">
                        {deal.expected_close_date
                          ? new Date(deal.expected_close_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TierGate>
  );
}
