import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import MetricGrid from '@/components/admin/reports/MetricGrid';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  pct: number;
}

interface ProjectBreakdown {
  projectName: string;
  total: number;
  count: number;
}

interface ExpenseData {
  totalExpenses: number;
  approved: number;
  pending: number;
  rejected: number;
  categories: CategoryBreakdown[];
  projects: ProjectBreakdown[];
  expenseCount: number;
}

async function getExpenseData(): Promise<ExpenseData> {
  const empty: ExpenseData = {
    totalExpenses: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    categories: [],
    projects: [],
    expenseCount: 0,
  };

  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    // Fetch all expenses for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category, status, proposal_id, proposals(name)')
      .eq('organization_id', ctx.organizationId)
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd);

    if (!expenses || expenses.length === 0) return empty;

    const total = expenses.reduce((s, e) => s + ((e.amount as number) ?? 0), 0);
    const approved = expenses
      .filter((e) => e.status === 'approved')
      .reduce((s, e) => s + ((e.amount as number) ?? 0), 0);
    const pending = expenses
      .filter((e) => e.status === 'pending')
      .reduce((s, e) => s + ((e.amount as number) ?? 0), 0);
    const rejected = expenses
      .filter((e) => e.status === 'rejected')
      .reduce((s, e) => s + ((e.amount as number) ?? 0), 0);

    // Category breakdown
    const catMap = new Map<string, { total: number; count: number }>();
    for (const exp of expenses) {
      const cat = (exp.category as string) ?? 'Uncategorized';
      const existing = catMap.get(cat) ?? { total: 0, count: 0 };
      existing.total += (exp.amount as number) ?? 0;
      existing.count += 1;
      catMap.set(cat, existing);
    }
    const categories = Array.from(catMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, d]) => ({
        category: cat,
        total: d.total,
        count: d.count,
        pct: total > 0 ? Math.round((d.total / total) * 100) : 0,
      }));

    // Project breakdown
    const projMap = new Map<string, { total: number; count: number }>();
    for (const exp of expenses as Array<Record<string, unknown>>) {
      const proposal = exp.proposals as Record<string, string> | null;
      const projName = proposal?.name ?? 'Unallocated';
      const existing = projMap.get(projName) ?? { total: 0, count: 0 };
      existing.total += (exp.amount as number) ?? 0;
      existing.count += 1;
      projMap.set(projName, existing);
    }
    const projects = Array.from(projMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, d]) => ({
        projectName: name,
        total: d.total,
        count: d.count,
      }));

    return {
      totalExpenses: total,
      approved,
      pending,
      rejected,
      categories,
      projects,
      expenseCount: expenses.length,
    };
  } catch {
    return empty;
  }
}

export default async function ExpenseAnalysisPage() {
  const data = await getExpenseData();
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  return (
    <TierGate feature="expenses">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/reports" className="hover:text-foreground transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Expense Analysis</span>
      </nav>

      <div className="flex items-center justify-between mb-2">
        <PageHeader title="Expense Analysis" subtitle={`Expense breakdown for ${monthName}`} />
        <Link href={`/api/documents/expense-report?from=${from}&to=${to}`}>
          <Button variant="secondary" size="sm">
            <Download size={14} className="mr-1.5" />
            Export DOCX
          </Button>
        </Link>
      </div>

      <ReportsHubTabs />

      {/* Summary Cards */}
      <MetricGrid
        metrics={[
          { label: 'Total Expenses', value: formatCurrency(data.totalExpenses) },
          { label: 'Approved', value: formatCurrency(data.approved), changeType: 'positive' },
          { label: 'Pending', value: formatCurrency(data.pending), changeType: data.pending > 0 ? 'negative' : 'neutral' },
          { label: 'Rejected', value: formatCurrency(data.rejected), changeType: data.rejected > 0 ? 'negative' : 'neutral' },
        ]}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mt-8">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">By Category</h3>
          </div>
          {data.categories.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-text-secondary">No expense data for this period.</div>
          ) : (
            <div className="divide-y divide-border">
              {data.categories.map((cat) => (
                <div key={cat.category} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">{cat.category}</span>
                      <span className="text-sm tabular-nums text-foreground font-medium ml-2">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/70 transition-all"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted tabular-nums w-10 text-right">{cat.pct}%</span>
                    </div>
                  </div>
                  <Badge variant="muted" className="min-w-[2rem] justify-center">{String(cat.count)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Breakdown */}
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">By Project</h3>
          </div>
          {data.projects.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-text-secondary">No expense data for this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-bg-secondary">
                    <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</TableHead>
                    <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Count</TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.projects.map((p) => {
                    const pct = data.totalExpenses > 0
                      ? ((p.total / data.totalExpenses) * 100).toFixed(1)
                      : '0';
                    return (
                      <TableRow key={p.projectName} className="transition-colors hover:bg-bg-secondary/50">
                        <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{p.projectName}</TableCell>
                        <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(p.total)}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center text-sm tabular-nums text-text-secondary">{p.count}</TableCell>
                        <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-text-secondary">{pct}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </TierGate>
  );
}
