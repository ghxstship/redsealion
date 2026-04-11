import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import { PROFITABILITY_ELIGIBLE_STATUSES } from '@/lib/constants/project';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import ProfitabilityExportButton from './ProfitabilityExportButton';

interface ProfitRow {
  id: string;
  name: string;
  clientName: string | null;
  revenue: number;
  totalCosts: number;
  margin: number;
  marginPct: number;
}

async function getOrgProfitability(): Promise<ProfitRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, total_value, client_id, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .in('status', [...PROFITABILITY_ELIGIBLE_STATUSES])
      .order('created_at', { ascending: false });

    if (!proposals || proposals.length === 0) return [];

    const proposalIds = proposals.map((p) => p.id);
    const { data: costs } = await supabase
      .from('project_costs')
      .select('proposal_id, amount')
      .in('proposal_id', proposalIds);

    const costByProposal = new Map<string, number>();
    for (const c of costs ?? []) {
      costByProposal.set(c.proposal_id, (costByProposal.get(c.proposal_id) ?? 0) + c.amount);
    }

    return proposals.map((p: Record<string, unknown>) => {
      const client = p.clients as { company_name: string } | null;
      const revenue = (p.total_value as number) ?? 0;
      const totalCosts = costByProposal.get(p.id as string) ?? 0;
      const margin = revenue - totalCosts;
      const marginPct = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;

      return {
        id: p.id as string,
        name: p.name as string,
        clientName: client?.company_name ?? null,
        revenue,
        totalCosts,
        margin,
        marginPct,
      };
    });
  } catch {
    return [];
  }
}

export default async function ProfitabilityDashboardPage() {
  const projects = await getOrgProfitability();
  const totalRevenue = projects.reduce((s, p) => s + p.revenue, 0);
  const totalCosts = projects.reduce((s, p) => s + p.totalCosts, 0);
  const totalMargin = totalRevenue - totalCosts;
  const avgMarginPct = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;

  return (
    <TierGate feature="profitability">
      <PageHeader title="Profitability" subtitle="Org-wide profitability across all projects.">
        <ProfitabilityExportButton projects={projects} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Costs</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalCosts)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Net Margin</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalMargin)}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Avg Margin %</p>
          <p className={`mt-2 text-3xl font-semibold tracking-tight ${avgMarginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {avgMarginPct}%
          </p>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {projects.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No project data available. Create proposals to start tracking profitability.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Costs</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-4 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/profitability/${p.id}`} className="font-medium text-foreground hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{p.clientName ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.totalCosts)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${p.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(p.margin)}
                    </td>
                    <td className={`px-4 py-3 text-right tabular-nums ${p.marginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {p.marginPct}%
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
