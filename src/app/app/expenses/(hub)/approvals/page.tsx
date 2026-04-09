import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import ExpenseApprovalActions from '@/components/admin/expenses/ExpenseApprovalActions';

interface PendingExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  status: string;
  user_name: string;
}

async function getPendingExpenses(): Promise<{ pending: PendingExpense[]; approvedCount: number; rejectedCount: number }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { pending: [], approvedCount: 0, rejectedCount: 0 };

    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('id, category, description, amount, expense_date, status, users(full_name)')
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .order('expense_date', { ascending: false }),
      supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .gte('approved_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'rejected')
        .is('deleted_at', null),
    ]);

    const pending = (pendingRes.data ?? []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      category: e.category as string,
      description: e.description as string | null,
      amount: e.amount as number,
      expense_date: e.expense_date as string,
      status: e.status as string,
      user_name: (e.users as Record<string, string>)?.full_name ?? 'Unknown',
    }));

    return {
      pending,
      approvedCount: approvedRes.count ?? 0,
      rejectedCount: rejectedRes.count ?? 0,
    };
  } catch {
    return { pending: [], approvedCount: 0, rejectedCount: 0 };
  }
}

export default async function ExpenseApprovalsPage() {
  const { pending, approvedCount, rejectedCount } = await getPendingExpenses();

  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Expense Approvals"
        subtitle="Review and approve pending expense reports."
      />

      <ExpensesHubTabs />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Pending Review</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{pending.length}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Approved This Month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{approvedCount}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Rejected</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{rejectedCount}</p>
        </Card>
      </div>

      {pending.length > 0 ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Submitted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{exp.user_name}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-sm text-foreground capitalize">{exp.category}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{exp.description ?? '—'}</td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(exp.amount)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <ExpenseApprovalActions expenseId={exp.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          message="No expenses pending approval"
          description="When team members submit expenses, they'll appear here for review."
        />
      )}
    </TierGate>
  );
}
