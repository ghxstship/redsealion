import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import FinanceHubTabs from '../../FinanceHubTabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, total_value')
      .eq('organization_id', ctx.organizationId)
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
      <PageHeader
        title="Profitability"
        subtitle="Analyze margins and profitability across projects."
      />

      <FinanceHubTabs />

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
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Gross Margin</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalMargin)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Avg Margin %</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{avgMargin}%</p>
        </Card>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">
            No active projects with cost data to display.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Revenue</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Costs</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Margin</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {projects.map((p) => (
                  <TableRow key={p.proposalId} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5">
                      <Link
                        href={`/app/profitability/${p.proposalId}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(p.revenue)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(p.costs)}</TableCell>
                    <TableCell className={`px-6 py-3.5 text-right text-sm tabular-nums font-medium ${p.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(p.margin)}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.marginPercent >= 30 ? 'bg-green-50 text-green-700' :
                        p.marginPercent >= 10 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-500/10 text-red-700'
                      }`}>
                        {p.marginPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
