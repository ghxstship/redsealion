import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import ExpensesTable from '@/components/admin/expenses/ExpensesTable';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('expenses')
      .select('id, category, description, amount, expense_date, status')
      .eq('user_id', user.id)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Expenses</h1>
          <p className="mt-1 text-sm text-text-secondary">Submit and track expense reports.</p>
        </div>
        <Link
          href="/app/expenses/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          New Expense
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Expenses</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{expenses.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Pending</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Approved</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalApproved)}</p>
        </div>
      </div>

      <ExpensesTable expenses={expenses} />
    </TierGate>
  );
}
