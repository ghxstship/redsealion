import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface BudgetSummary {
  id: string;
  projectName: string;
  totalBudget: number;
  spent: number;
  percentUsed: number;
}

async function getBudgets(): Promise<BudgetSummary[]> {
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

    const { data } = await supabase
      .from('project_budgets')
      .select('id, proposal_id, total_budget, spent')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    const proposalIds = data.map((b) => b.proposal_id).filter(Boolean);
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name')
      .in('id', proposalIds);

    const nameMap = new Map((proposals ?? []).map((p) => [p.id, p.name]));

    return data.map((b) => ({
      id: b.id,
      projectName: nameMap.get(b.proposal_id) ?? 'Unknown Project',
      totalBudget: b.total_budget,
      spent: b.spent,
      percentUsed: b.total_budget > 0 ? Math.round((b.spent / b.total_budget) * 100) : 0,
    }));
  } catch {
    return [];
  }
}

export default async function BudgetsPage() {
  const budgets = await getBudgets();

  return (
    <TierGate feature="budgets">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Project Budgets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track spending against project budgets.
        </p>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">
            No project budgets created yet. Create a budget from a proposal to start tracking spending.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Link
              key={budget.id}
              href={`/app/budgets/${budget.id}`}
              className="group rounded-xl border border-border bg-white px-5 py-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <p className="text-sm font-medium text-foreground group-hover:underline">
                {budget.projectName}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-text-muted">Spent</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(budget.spent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Budget</p>
                  <p className="text-sm tabular-nums text-text-secondary">
                    {formatCurrency(budget.totalBudget)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">{budget.percentUsed}% used</span>
                </div>
                <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.percentUsed > 90
                        ? 'bg-red-500'
                        : budget.percentUsed > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </TierGate>
  );
}
