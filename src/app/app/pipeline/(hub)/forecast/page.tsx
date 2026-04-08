import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';

async function getForecast() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { stages: [], totalPipeline: 0, totalWeighted: 0 };
    const { data } = await supabase
      .from('deals')
      .select('stage, value, probability')
      .eq('organization_id', ctx.organizationId)
      .not('stage', 'eq', 'closed_lost');

    const deals = (data ?? []) as Array<{ stage: string; value: number; probability: number }>;
    const stageMap = deals.reduce((acc, d) => {
      const key = d.stage ?? 'unknown';
      if (!acc[key]) acc[key] = { count: 0, value: 0, weighted: 0 };
      acc[key].count++;
      acc[key].value += d.value ?? 0;
      acc[key].weighted += (d.value ?? 0) * ((d.probability ?? 0) / 100);
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
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Pipeline Value</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(totalPipeline)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Weighted Forecast</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{formatCurrency(totalWeighted)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Active Stages</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stages.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {stages.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No deals with values in your pipeline. Add deal values and probabilities to see forecasts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Deals</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Weighted Value</th>
                  <th className="px-4 py-3">Forecast Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stages.map((stage) => (
                  <tr key={stage.stage} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground capitalize">{stage.stage.replace('_', ' ')}</td>
                    <td className="px-4 py-3 tabular-nums">{stage.count}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(stage.value)}</td>
                    <td className="px-4 py-3 tabular-nums font-medium text-green-600">{formatCurrency(stage.weighted)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${totalWeighted > 0 ? Math.round((stage.weighted / totalWeighted) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-text-muted">{totalWeighted > 0 ? Math.round((stage.weighted / totalWeighted) * 100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
