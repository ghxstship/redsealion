import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getForecast() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { stages: [], totalPipeline: 0, totalWeighted: 0 };
    const { data } = await supabase
      .from('deals')
      .select('stage, deal_value, probability')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .not('stage', 'in', '(lost,on_hold)');

    const deals = (data ?? []) as Array<{ stage: string; deal_value: number; probability: number }>;
    const stageMap = deals.reduce((acc, d) => {
      const key = d.stage ?? 'unknown';
      if (!acc[key]) acc[key] = { count: 0, value: 0, weighted: 0 };
      acc[key].count++;
      acc[key].value += d.deal_value ?? 0;
      acc[key].weighted += (d.deal_value ?? 0) * ((d.probability ?? 0) / 100);
      return acc;
    }, {} as Record<string, { count: number; value: number; weighted: number }>);

    const stages = Object.entries(stageMap).map(([stage, data]) => ({ stage, ...data })).sort((a, b) => b.weighted - a.weighted);
    const totalPipeline = stages.reduce((s, st) => s + st.value, 0);
    const totalWeighted = stages.reduce((s, st) => s + st.weighted, 0);
    return { stages, totalPipeline, totalWeighted };
  } catch { return { stages: [], totalPipeline: 0, totalWeighted: 0 }; }
}

export default async function PipelineForecastPage() {
  const { stages, totalPipeline, totalWeighted } = await getForecast();

  return (
    <TierGate feature="pipeline">
      <PageHeader title="Revenue Forecast" subtitle="Projected revenue based on pipeline stage probabilities." />
      <PipelineHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Pipeline Value"} value={formatCurrency(totalPipeline)} />
        <MetricCard label={"Weighted Forecast"} value={formatCurrency(totalWeighted)} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Active Stages"} value={stages.length} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {stages.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No deals with values in your pipeline. Add deal values and probabilities to see forecasts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Stage</TableHead>
                  <TableHead className="px-4 py-3">Deals</TableHead>
                  <TableHead className="px-4 py-3">Total Value</TableHead>
                  <TableHead className="px-4 py-3">Weighted Value</TableHead>
                  <TableHead className="px-4 py-3">Forecast Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {stages.map((stage) => (
                  <TableRow key={stage.stage} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground capitalize">{stage.stage.replace('_', ' ')}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{stage.count}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(stage.value)}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums font-medium text-green-600">{formatCurrency(stage.weighted)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${totalWeighted > 0 ? Math.round((stage.weighted / totalWeighted) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-text-muted">{totalWeighted > 0 ? Math.round((stage.weighted / totalWeighted) * 100) : 0}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
