import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import ChartContainer from '@/components/admin/reports/ChartContainer';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import type { DealStage } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

const FUNNEL_STAGES: { key: DealStage; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal_sent', label: 'Proposal Sent' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'verbal_yes', label: 'Verbal Yes' },
  { key: 'contract_signed', label: 'Contract Signed' },
];

interface FunnelDeal {
  stage: DealStage;
  deal_value: number;
  created_at: string;
}

async function getFunnelData(): Promise<FunnelDeal[]> {
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
      .select('stage, deal_value, created_at')
      .eq('organization_id', ctx.organizationId);

    return (deals ?? []) as FunnelDeal[];
  } catch {
    return [];
  }
}

async function getLeadCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return 0;
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function FunnelReportPage() {
  const [deals, totalLeads] = await Promise.all([
    getFunnelData(),
    getLeadCount(),
  ]);

  // Build stage order index for "has reached at least this stage"
  const stageIndex: Record<string, number> = {};
  FUNNEL_STAGES.forEach((s, i) => {
    stageIndex[s.key] = i;
  });

  // Count deals that have reached or passed each funnel stage
  // (A deal at "negotiation" has passed through lead, qualified, proposal_sent)
  const funnelData = FUNNEL_STAGES.map((stage, idx) => {
    const dealsReached = deals.filter((d) => {
      const dealIdx = stageIndex[d.stage] ?? -1;
      // Include lost deals that were at or past this stage (assume linear progression)
      // For simplicity, count deals currently at or beyond this stage
      return dealIdx >= idx;
    });

    return {
      ...stage,
      count: idx === 0 ? Math.max(dealsReached.length, totalLeads) : dealsReached.length,
      value: dealsReached.reduce((s, d) => s + d.deal_value, 0),
    };
  });

  // Calculate conversion rates between stages
  const conversionRates = funnelData.map((stage, idx) => {
    if (idx === 0) return { ...stage, rate: 100 };
    const prevCount = funnelData[idx - 1].count;
    const rate = prevCount > 0 ? (stage.count / prevCount) * 100 : 0;
    return { ...stage, rate };
  });

  // Overall conversion
  const overallConversion =
    funnelData[0].count > 0
      ? (funnelData[funnelData.length - 1].count / funnelData[0].count) * 100
      : 0;

  const maxCount = Math.max(...funnelData.map((s) => s.count), 1);

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Conversion Funnel</span>
      </nav>

      <PageHeader title="Conversion Funnel" />

      <ReportsHubTabs />

      <div className="space-y-8">
        <MetricGrid
          metrics={[
            { label: 'Total Leads', value: totalLeads.toString() },
            { label: 'Active Deals', value: deals.filter((d) => d.stage !== 'lost' && d.stage !== 'contract_signed').length.toString() },
            { label: 'Won Deals', value: deals.filter((d) => d.stage === 'contract_signed').length.toString(), changeType: 'positive' },
            {
              label: 'Overall Conversion',
              value: `${overallConversion.toFixed(1)}%`,
              changeType: overallConversion >= 20 ? 'positive' : overallConversion >= 10 ? 'neutral' : 'negative',
            },
          ]}
        />

        {/* Funnel Visualization */}
        <ChartContainer title="Sales Funnel" height={320}>
          <div className="flex flex-col gap-2 items-center justify-center h-full">
            {conversionRates.map((stage, idx) => {
              const widthPct = Math.max(20, (stage.count / maxCount) * 100);
              return (
                <div key={stage.key} className="w-full flex items-center gap-4">
                  <div className="w-28 text-right">
                    <p className="text-xs font-medium text-foreground">{stage.label}</p>
                    <p className="text-[10px] text-text-muted">{stage.count} deals</p>
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className="h-8 rounded transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: `hsl(220, 70%, ${40 + idx * 8}%)`,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    {idx > 0 && (
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          stage.rate >= 50
                            ? 'text-green-600'
                            : stage.rate >= 25
                              ? 'text-amber-600'
                              : 'text-red-600'
                        }`}
                      >
                        {stage.rate.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ChartContainer>

        {/* Stage-by-stage table */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Stage-by-Stage Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Stage</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Deals</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Value</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Conv. Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Drop-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {conversionRates.map((stage, idx) => {
                  const dropOff = idx > 0 ? funnelData[idx - 1].count - stage.count : 0;
                  return (
                    <tr key={stage.key} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{stage.label}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{stage.count}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                        {formatCurrency(stage.value)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                        {idx === 0 ? '—' : `${stage.rate.toFixed(1)}%`}
                      </td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-red-600">
                        {dropOff > 0 ? `-${dropOff}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TierGate>
  );
}
