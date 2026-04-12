import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import PipelineHubTabs from '../../PipelineHubTabs';
import MetricCard from '@/components/ui/MetricCard';

const DEFAULT_COMMISSION_RATE = 0.1; // 10% fallback

/**
 * Commissions Page
 *
 * #8:  Reads commission_rate from organizations.settings instead of hardcoding.
 * #24: Includes all won stages (contract_signed + any deal with won_date IS NOT NULL).
 */

async function getCommissions() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { deals: [], commissionRate: DEFAULT_COMMISSION_RATE };

    // #8: Read commission rate from org settings
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ctx.organizationId)
      .single();

    const settings = (org?.settings ?? {}) as Record<string, unknown>;
    const commissionRate = typeof settings.commission_rate === 'number'
      ? settings.commission_rate
      : DEFAULT_COMMISSION_RATE;

    // #24: Include all won stages — contract_signed OR any deal with won_date set
    const { data } = await supabase
      .from('deals')
      .select('id, title, stage, deal_value, probability, won_date, owner_id, users:owner_id(full_name)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .or('stage.eq.contract_signed,won_date.not.is.null')
      .order('deal_value', { ascending: false });

    const deals = (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      title: d.title as string,
      stage: d.stage as string,
      value: (d.deal_value ?? 0) as number,
      won_date: d.won_date as string | null,
      owner_name: Array.isArray(d.users)
        ? (d.users as Record<string, unknown>[])[0]?.full_name as string
        : (d.users as Record<string, unknown> | null)?.full_name as string ?? 'Unassigned',
    }));

    return { deals, commissionRate };
  } catch {
    return { deals: [], commissionRate: DEFAULT_COMMISSION_RATE };
  }
}

export default async function CommissionsPage() {
  const { deals, commissionRate } = await getCommissions();
  const totalRevenue = deals.reduce((s, d) => s + d.value, 0);
  const totalCommissions = totalRevenue * commissionRate;
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
          { label: `Commission (${Math.round(commissionRate * 100)}%)`, value: formatCurrency(totalCommissions) },
          { label: 'Sales Reps', value: String(repList.length) },
        ].map((stat) => (
          <MetricCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            valueClassName={stat.color}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
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
                    <td className="px-4 py-3 tabular-nums font-medium text-green-600">{formatCurrency(data.revenue * commissionRate)}</td>
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
