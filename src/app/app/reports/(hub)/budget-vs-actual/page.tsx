import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface BudgetRow {
  projectName: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number;
}

async function getBudgetData(): Promise<{ rows: BudgetRow[]; totalBudget: number; totalActual: number }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, budget_total')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['active', 'in_progress', 'production', 'complete']);

    if (!proposals || proposals.length === 0) {
      return { rows: [], totalBudget: 0, totalActual: 0 };
    }

    const ids = proposals.map((p) => p.id);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('proposal_id, amount')
      .eq('organization_id', ctx.organizationId)
      .in('proposal_id', ids);

    const expenseMap = new Map<string, number>();
    for (const e of expenses ?? []) {
      const pid = e.proposal_id as string;
      expenseMap.set(pid, (expenseMap.get(pid) ?? 0) + ((e.amount as number) ?? 0));
    }

    const rows: BudgetRow[] = proposals.map((p) => {
      const budgeted = (p.budget_total as number) ?? 0;
      const actual = expenseMap.get(p.id as string) ?? 0;
      const variance = budgeted - actual;
      return {
        projectName: p.name,
        budgeted,
        actual,
        variance,
        variancePct: budgeted > 0 ? Math.round((variance / budgeted) * 100) : 0,
      };
    }).sort((a, b) => a.variance - b.variance);

    const totalBudget = rows.reduce((s, r) => s + r.budgeted, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);

    return { rows, totalBudget, totalActual };
  } catch {
    return { rows: [], totalBudget: 0, totalActual: 0 };
  }
}

export default async function BudgetVsActualPage() {
  const { rows, totalBudget, totalActual } = await getBudgetData();
  const totalVariance = totalBudget - totalActual;
  const variancePct = totalBudget > 0 ? ((totalVariance / totalBudget) * 100).toFixed(1) : '0';

  return (
    <TierGate feature="reports">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">Reports</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Budget vs. Actual</span>
      </nav>

      <PageHeader title="Budget vs. Actual" subtitle="Compare budgeted amounts against actual spend per project" />
      <ReportsHubTabs />

      <MetricGrid
        metrics={[
          { label: 'Total Budget', value: formatCurrency(totalBudget) },
          { label: 'Total Spend', value: formatCurrency(totalActual) },
          { label: 'Variance', value: formatCurrency(totalVariance), changeType: totalVariance >= 0 ? 'positive' : 'negative' },
          { label: 'Variance %', value: `${variancePct}%`, changeType: totalVariance >= 0 ? 'positive' : 'negative' },
        ]}
      />

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No project budget data available.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Budget</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Actual</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Variance</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Var. %</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.projectName} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{r.projectName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-text-secondary">{formatCurrency(r.budgeted)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(r.actual)}</TableCell>
                    <TableCell className={`px-6 py-3.5 text-right text-sm font-medium tabular-nums ${r.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(r.variance)}
                    </TableCell>
                    <TableCell className={`px-6 py-3.5 text-right text-sm tabular-nums ${r.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.variancePct}%
                    </TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${r.budgeted > 0 && (r.actual / r.budgeted) > 1 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((r.actual / Math.max(r.budgeted, 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted tabular-nums">
                          {r.budgeted > 0 ? `${Math.round((r.actual / r.budgeted) * 100)}%` : '\u2014'}
                        </span>
                      </div>
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
