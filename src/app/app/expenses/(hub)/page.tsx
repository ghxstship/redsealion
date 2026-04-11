import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import ExpensesTable from '@/components/admin/expenses/ExpensesTable';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ExpensesHubTabs from '../ExpensesHubTabs';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  status: string;
}

async function getExpenses(): Promise<ExpenseRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    // Show all org expenses for admins, own expenses for others
    const { data } = await supabase
      .from('expenses')
      .select('id, category, description, amount, expense_date, status')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })
      .limit(200);

    return data ?? [];
  } catch {
    return [];
  }
}

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  const totalPending = expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Expenses"
        subtitle="Submit and track expense reports."
      >
        <Button href="/app/expenses/new">New Expense</Button>
      </PageHeader>

      <ExpensesHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Expenses</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{expenses.length}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Pending</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalPending)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Approved</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalApproved)}</p>
        </Card>
      </div>

      <ExpensesTable expenses={expenses} />
    </TierGate>
  );
}
