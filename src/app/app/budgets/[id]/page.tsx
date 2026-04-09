import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import BurnChart from '@/components/admin/budgets/BurnChart';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

interface BudgetDetail {
  projectName: string;
  totalBudget: number;
  spent: number;
  lineItems: Array<{
    id: string;
    category: string;
    description: string | null;
    planned: number;
    actual: number;
  }>;
}

async function getBudgetDetail(id: string): Promise<BudgetDetail | null> {
  try {
    const supabase = await createClient();
    const { data: budget } = await supabase
      .from('project_budgets')
      .select('id, proposal_id, total_budget, spent')
      .eq('id', id)
      .single();

    if (!budget) return null;

    const [proposalRes, itemsRes] = await Promise.all([
      supabase.from('proposals').select('name').eq('id', budget.proposal_id).single(),
      supabase
        .from('budget_line_items')
        .select('id, category, description, planned_amount, actual_amount')
        .eq('budget_id', id)
        .order('created_at', { ascending: true }),
    ]);

    return {
      projectName: proposalRes.data?.name ?? 'Unknown Project',
      totalBudget: budget.total_budget,
      spent: budget.spent,
      lineItems: (itemsRes.data ?? []).map((item) => ({
        id: item.id,
        category: item.category,
        description: item.description,
        planned: item.planned_amount,
        actual: item.actual_amount,
      })),
    };
  } catch {
    return null;
  }
}

export default async function BudgetDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const budget = await getBudgetDetail(id);

  if (!budget) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Budget not found.</p>
      </div>
    );
  }

  const percentUsed = budget.totalBudget > 0
    ? Math.round((budget.spent / budget.totalBudget) * 100)
    : 0;

  return (
    <TierGate feature="budgets">
<PageHeader
        title={budget.projectName}
        subtitle="Budget tracking and burn-down analysis."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Budget</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(budget.totalBudget)}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Spent</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(budget.spent)}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Remaining</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(budget.totalBudget - budget.spent)}
          </p>
          <p className="mt-1 text-xs text-text-secondary">{percentUsed}% consumed</p>
        </Card>
      </div>

      <div className="mb-8">
        <BurnChart totalBudget={budget.totalBudget} spent={budget.spent} />
      </div>

      {budget.lineItems.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Planned</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {budget.lineItems.map((item) => {
                  const variance = item.planned - item.actual;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">{item.category}</td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">{item.description ?? '-'}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(item.planned)}</td>
                      <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(item.actual)}</td>
                      <td className={`px-6 py-3.5 text-right text-sm tabular-nums font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
