import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { getSeedDeals, getSeedClients } from '@/lib/seed-data';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import ChartContainer from '@/components/admin/reports/ChartContainer';
import type { DealStage } from '@/types/database';

async function getDealsData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) throw new Error('No org');

    const { data: deals } = await supabase
      .from('deals')
      .select('*, clients(company_name)')
      .eq('organization_id', userData.organization_id);

    return {
      deals: (deals ?? []) as Array<{
        stage: DealStage;
        deal_value: number;
        client_id: string;
        clients?: { company_name: string };
      }>,
    };
  } catch {
    const deals = getSeedDeals();
    const clients = getSeedClients();
    return {
      deals: deals.map((d) => ({
        ...d,
        clients: { company_name: clients.find((c) => c.id === d.client_id)?.company_name ?? 'Unknown' },
      })),
    };
  }
}

export default async function WinRateReportPage() {
  const { deals } = await getDealsData();

  const won = deals.filter((d) => d.stage === 'contract_signed');
  const lost = deals.filter((d) => d.stage === 'lost');
  const closed = [...won, ...lost];
  const winRate = closed.length > 0 ? (won.length / closed.length) * 100 : 0;
  const avgWonValue = won.length > 0 ? won.reduce((s, d) => s + d.deal_value, 0) / won.length : 0;

  // Group by client
  const clientMap = new Map<string, { name: string; won: number; lost: number; total: number }>();
  for (const deal of closed) {
    const name = deal.clients?.company_name ?? 'Unknown';
    const entry = clientMap.get(deal.client_id) ?? { name, won: 0, lost: 0, total: 0 };
    if (deal.stage === 'contract_signed') {
      entry.won++;
      entry.total += deal.deal_value;
    } else {
      entry.lost++;
    }
    clientMap.set(deal.client_id, entry);
  }
  const clientStats = Array.from(clientMap.values());

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Win Rate</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-8">
        Win Rate Analysis
      </h1>

      <div className="space-y-8">
        <MetricGrid
          metrics={[
            { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, changeType: winRate >= 50 ? 'positive' : 'negative' },
            { label: 'Deals Won', value: won.length.toString(), changeType: 'positive' },
            { label: 'Deals Lost', value: lost.length.toString(), changeType: 'negative' },
            {
              label: 'Avg Won Value',
              value: avgWonValue > 0
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(avgWonValue)
                : '$0',
            },
          ]}
        />

        <ChartContainer title="Win/Loss Distribution" height={200}>
          <div className="flex items-center gap-8 h-full">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-12">Won</span>
                <div
                  className="h-8 rounded bg-green-500/80"
                  style={{ width: `${closed.length > 0 ? (won.length / closed.length) * 100 : 0}%` }}
                />
                <span className="text-sm font-medium text-foreground tabular-nums">{won.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-12">Lost</span>
                <div
                  className="h-8 rounded bg-red-400/80"
                  style={{ width: `${closed.length > 0 ? (lost.length / closed.length) * 100 : 0}%` }}
                />
                <span className="text-sm font-medium text-foreground tabular-nums">{lost.length}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-foreground">{winRate.toFixed(0)}%</p>
              <p className="text-xs text-text-muted mt-1">Overall Win Rate</p>
            </div>
          </div>
        </ChartContainer>

        {clientStats.length > 0 && (
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Win Rate by Client</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Client</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Won</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Lost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientStats.map((cs) => {
                  const total = cs.won + cs.lost;
                  const rate = total > 0 ? (cs.won / total) * 100 : 0;
                  return (
                    <tr key={cs.name} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{cs.name}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-green-700">{cs.won}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-red-700">{cs.lost}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{rate.toFixed(0)}%</td>
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
