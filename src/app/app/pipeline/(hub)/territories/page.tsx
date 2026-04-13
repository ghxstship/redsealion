import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getTerritoryData() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { territories: [], deals: [] };
    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, stage, deal_value, owner_id, clients(state, country)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null);
    const parsed = (deals ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string, title: d.title as string, stage: d.stage as string, value: (d.deal_value ?? 0) as number,
      owner_id: d.owner_id as string | null,
      region: Array.isArray(d.clients) ? (d.clients as Record<string, unknown>[])[0]?.state as string ?? (d.clients as Record<string, unknown>[])[0]?.country as string : (d.clients as Record<string, unknown> | null)?.state as string ?? (d.clients as Record<string, unknown> | null)?.country as string ?? 'Unassigned',
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
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {territories.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No deal territories yet. Territories are derived from client address data.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow><TableHead className="px-4 py-3">Region</TableHead><TableHead className="px-4 py-3">Deals</TableHead><TableHead className="px-4 py-3">Pipeline Value</TableHead><TableHead className="px-4 py-3">% of Total</TableHead></TableRow>
              </TableHeader>
              <TableBody >
                {territories.map(([region, data]) => (
                  <TableRow key={region} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{region}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{data.count}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(data.value)}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{totalValue > 0 ? `${Math.round((data.value / totalValue) * 100)}%` : '0%'}</TableCell>
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
