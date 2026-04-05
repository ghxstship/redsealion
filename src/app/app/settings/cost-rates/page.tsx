import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { formatRate, DEFAULT_COST_RATES } from '@/lib/cost-rates';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import CostRatesHeader from '@/components/admin/settings/CostRatesHeader';

interface RateRow {
  id: string;
  role: string;
  hourlyCost: number;
  hourlyBillable: number;
  effectiveFrom: string;
  marginPercent: number;
}

async function getCostRates(): Promise<RateRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('cost_rates')
      .select('id, role, hourly_cost, hourly_billable, effective_from')
      .eq('organization_id', ctx.organizationId)
      .order('role');

    if (!data || data.length === 0) return getDefaultRates();

    return data.map((r) => {
      const margin = r.hourly_billable > 0
        ? Math.round(((r.hourly_billable - r.hourly_cost) / r.hourly_billable) * 100)
        : 0;
      return {
        id: r.id,
        role: r.role,
        hourlyCost: r.hourly_cost,
        hourlyBillable: r.hourly_billable,
        effectiveFrom: r.effective_from,
        marginPercent: margin,
      };
    });
  } catch {
    return getDefaultRates();
  }
}

function getDefaultRates(): RateRow[] {
  return Object.entries(DEFAULT_COST_RATES).map(([role, rates], i) => ({
    id: `default-${i}`,
    role,
    hourlyCost: rates.cost,
    hourlyBillable: rates.billable,
    effectiveFrom: new Date().toISOString().split('T')[0],
    marginPercent: Math.round(((rates.billable - rates.cost) / rates.billable) * 100),
  }));
}

function marginColor(percent: number): string {
  if (percent >= 60) return 'text-green-600';
  if (percent >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export default async function CostRatesPage() {
  const rates = await getCostRates();

  return (
    <TierGate feature="profitability">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cost Rates</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage role-based cost and billable rates for profitability tracking.
          </p>
        </div>
        <CostRatesHeader />
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Hourly Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Hourly Billable</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Effective From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rates.map((rate) => (
                <tr key={rate.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground capitalize">
                    {rate.role.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                    {formatRate(rate.hourlyCost)}/hr
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">
                    {formatRate(rate.hourlyBillable)}/hr
                  </td>
                  <td className={`px-6 py-3.5 text-right text-sm font-medium tabular-nums ${marginColor(rate.marginPercent)}`}>
                    {rate.marginPercent}%
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">
                    {new Date(rate.effectiveFrom).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-bg-secondary/30 p-4">
        <p className="text-xs text-text-muted">
          <strong>Note:</strong> Cost rates define internal hourly costs per role, used for margin and profitability calculations.
          Billable rates define what clients are charged. Default rates are shown if custom rates are not configured.
        </p>
      </div>
    </TierGate>
  );
}
