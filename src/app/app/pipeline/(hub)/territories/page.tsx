import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';

async function getTerritoryData() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { territories: [], deals: [] };
    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, stage, value, owner_id, clients(state, country)')
      .eq('organization_id', ctx.organizationId);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const parsed = (deals ?? []).map((d: any) => ({
      id: d.id as string, title: d.title as string, stage: d.stage as string, value: (d.value ?? 0) as number,
      owner_id: d.owner_id as string | null,
      region: Array.isArray(d.clients) ? d.clients[0]?.state ?? d.clients[0]?.country : d.clients?.state ?? d.clients?.country ?? 'Unassigned',
    }));
    const territories = parsed.reduce((acc: Record<string, { count: number; value: number }>, d) => {
      const region = d.region ?? 'Unassigned';
      if (!acc[region]) acc[region] = { count: 0, value: 0 };
      acc[region].count++;
      acc[region].value += d.value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
    const sorted = Object.entries(territories).sort((a, b) => b[1].value - a[1].value);
    return { territories: sorted, deals: parsed };
  } catch { return { territories: [], deals: [] }; }
}

export default async function TerritoriesPage() {
  const { territories, deals } = await getTerritoryData();
  const totalValue = deals.reduce((s, d) => s + d.value, 0);

  return (
    <TierGate feature="pipeline">
      <PageHeader title="Territories" subtitle="Sales territory mapping and deal distribution by region." />
      <PipelineHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Regions', value: territories.length },
          { label: 'Total Deals', value: deals.length },
          { label: 'Pipeline Value', value: formatCurrency(totalValue), color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {territories.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No deal territories yet. Territories are derived from client address data.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Region</th><th className="px-4 py-3">Deals</th><th className="px-4 py-3">Pipeline Value</th><th className="px-4 py-3">% of Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {territories.map(([region, data]) => (
                <tr key={region} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{region}</td>
                  <td className="px-4 py-3 tabular-nums">{data.count}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(data.value)}</td>
                  <td className="px-4 py-3 tabular-nums">{totalValue > 0 ? `${Math.round((data.value / totalValue) * 100)}%` : '0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
