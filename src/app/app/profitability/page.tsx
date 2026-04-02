import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ProjectProfit {
  proposalId: string;
  name: string;
  revenue: number;
  costs: number;
  margin: number;
  marginPercent: number;
}

async function getProfitability(): Promise<ProjectProfit[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, total_value')
      .eq('organization_id', userData.organization_id)
      .in('status', ['approved', 'in_production', 'active', 'complete'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (!proposals || proposals.length === 0) return [];

    const proposalIds = proposals.map((p) => p.id);
    const { data: costs } = await supabase
      .from('project_costs')
      .select('proposal_id, amount')
      .in('proposal_id', proposalIds);

    const costMap = new Map<string, number>();
    for (const c of costs ?? []) {
      costMap.set(c.proposal_id, (costMap.get(c.proposal_id) ?? 0) + c.amount);
    }

    return proposals.map((p) => {
      const totalCosts = costMap.get(p.id) ?? 0;
      const margin = p.total_value - totalCosts;
      const marginPercent = p.total_value > 0 ? Math.round((margin / p.total_value) * 100) : 0;
      return {
        proposalId: p.id,
        name: p.name,
        revenue: p.total_value,
        costs: totalCosts,
        margin,
        marginPercent,
      };
    });
  } catch {
    return [];
  }
}

export default async function ProfitabilityPage() {
  const projects = await getProfitability();

  const totalRevenue = projects.reduce((s, p) => s + p.revenue, 0);
  const totalCosts = projects.reduce((s, p) => s + p.costs, 0);
  const totalMargin = totalRevenue - totalCosts;
  const avgMargin = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

  return (
    <TierGate feature="profitability">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Profitability
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Analyze margins and profitability across projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Costs</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalCosts)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Gross Margin</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalMargin)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Avg Margin %</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{avgMargin}%</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">
            No active projects with cost data to display.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Costs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Margin</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => (
                  <tr key={p.proposalId} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/app/profitability/${p.proposalId}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(p.revenue)}</td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(p.costs)}</td>
                    <td className={`px-6 py-3.5 text-right text-sm tabular-nums font-medium ${p.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(p.margin)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.marginPercent >= 30 ? 'bg-green-50 text-green-700' :
                        p.marginPercent >= 10 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {p.marginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
