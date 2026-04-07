import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';

async function getCommissions() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('deals')
      .select('id, title, stage, value, probability, owner_id, users:owner_id(full_name)')
      .eq('organization_id', ctx.organizationId)
      .in('stage', ['won', 'closed_won', 'completed'])
      .order('value', { ascending: false });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((d: any) => ({
      id: d.id as string, title: d.title as string, stage: d.stage as string, value: (d.value ?? 0) as number,
      owner_name: Array.isArray(d.users) ? d.users[0]?.full_name : d.users?.full_name ?? 'Unassigned',
    }));
  } catch { return []; }
}

const COMMISSION_RATE = 0.1; // 10% default

export default async function CommissionsPage() {
  const deals = await getCommissions();
  const totalRevenue = deals.reduce((s, d) => s + d.value, 0);
  const totalCommissions = totalRevenue * COMMISSION_RATE;
  const byRep = deals.reduce((acc: Record<string, { deals: number; revenue: number }>, d) => {
    const name = d.owner_name ?? 'Unassigned';
    if (!acc[name]) acc[name] = { deals: 0, revenue: 0 };
    acc[name].deals++;
    acc[name].revenue += d.value;
    return acc;
  }, {} as Record<string, { deals: number; revenue: number }>);
  const repList = Object.entries(byRep).sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <TierGate feature="pipeline">
      <PageHeader title="Commissions" subtitle="Sales commission tracking and payout projections." />
      <PipelineHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Won Deals', value: String(deals.length) },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-green-600' },
          { label: `Commission (${COMMISSION_RATE * 100}%)`, value: formatCurrency(totalCommissions) },
          { label: 'Sales Reps', value: String(repList.length) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {repList.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No commissions earned yet. Commissions are calculated from closed-won deals.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Sales Rep</th><th className="px-4 py-3">Deals Won</th><th className="px-4 py-3">Revenue</th><th className="px-4 py-3">Commission</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repList.map(([name, data]) => (
                  <tr key={name} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{name}</td>
                    <td className="px-4 py-3 tabular-nums">{data.deals}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(data.revenue)}</td>
                    <td className="px-4 py-3 tabular-nums font-medium text-green-600">{formatCurrency(data.revenue * COMMISSION_RATE)}</td>
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
