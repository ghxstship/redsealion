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

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  verbal_yes: 'Verbal Yes',
  contract_signed: 'Contract Signed',
  lost: 'Lost',
  on_hold: 'On Hold',
};

async function getPipelineData() {
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
      .select()
      .eq('organization_id', ctx.organizationId);

    return (deals ?? []) as Array<{ stage: DealStage; deal_value: number; probability: number }>;
  } catch {
    return [] as Array<{ stage: DealStage; deal_value: number; probability: number }>;
  }
}

export default async function PipelineReportPage() {
  const deals = await getPipelineData();

  const stages: DealStage[] = ['lead', 'qualified', 'proposal_sent', 'negotiation', 'verbal_yes', 'contract_signed'];
  const stageData = stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + d.deal_value, 0),
      weighted: stageDeals.reduce((s, d) => s + d.deal_value * (d.probability / 100), 0),
    };
  });

  const totalPipeline = deals.reduce((s, d) => s + d.deal_value, 0);
  const weightedPipeline = deals.reduce((s, d) => s + d.deal_value * (d.probability / 100), 0);
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0;
  const maxBarValue = Math.max(...stageData.map((s) => s.value), 1);

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Pipeline Analysis</span>
      </nav>

      <PageHeader title="Pipeline Analysis" />

      <ReportsHubTabs />

      <div className="space-y-8">
        <MetricGrid
          metrics={[
            { label: 'Total Pipeline', value: formatCurrency(totalPipeline) },
            { label: 'Weighted Pipeline', value: formatCurrency(weightedPipeline) },
            { label: 'Active Deals', value: deals.length.toString() },
            { label: 'Avg Deal Size', value: formatCurrency(avgDealSize) },
          ]}
        />

        <ChartContainer title="Deal Value by Stage" height={280}>
          <div className="flex items-end justify-between gap-3 h-full pb-8">
            {stageData.map((s) => (
              <div key={s.stage} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-text-muted">
                  {formatCurrency(s.value)}
                </span>
                <div
                  className="w-full rounded-t bg-foreground/80 transition-[width,height,opacity] min-h-[4px]"
                  style={{ height: `${(s.value / maxBarValue) * 200}px` }}
                />
                <span className="text-xs text-text-muted text-center leading-tight mt-1">
                  {STAGE_LABELS[s.stage]}
                </span>
                <span className="text-xs tabular-nums text-text-muted">
                  ({s.count})
                </span>
              </div>
            ))}
          </div>
        </ChartContainer>

        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Stage</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Deals</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Total Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Weighted Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stageData.map((s) => (
                <tr key={s.stage} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{STAGE_LABELS[s.stage]}</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{s.count}</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(s.value)}</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(s.weighted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TierGate>
  );
}
