import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { RoleGate } from '@/components/shared/RoleGate';
import Button from '@/components/ui/Button';

/**
 * /app/budgets — Standalone budgets page.
 *
 * Renders the same budget data as finance/budgets but as its own
 * standalone page. No redirects.
 *
 * BDG-01 remediation.
 */

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('project_budgets')
      .select('id, proposal_id, total_budget, spent')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
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
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'collaborator']}>
      <TierGate feature="budgets">
        <PageHeader
          title="Project Budgets"
          subtitle="Track spending against project budgets."
        >
          <Button href="/app/proposals">
            New Budget
          </Button>
        </PageHeader>

        {budgets.length === 0 ? (
          <EmptyState
            message="No project budgets created yet"
            description="Create a budget from a proposal to start tracking spending."
            action={
              <Button href="/app/proposals">
                Go to Proposals
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <Link
                key={budget.id}
                href={`/app/budgets/${budget.id}`}
                className="group rounded-xl border border-border bg-background px-5 py-5 transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-normal hover:shadow-md hover:-translate-y-0.5"
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
                      className={`h-full rounded-full transition-[width,opacity] ${
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
    </RoleGate>
  );
}
