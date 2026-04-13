import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency , formatDate } from '@/lib/utils';
import ExpenseApprovalActions from '@/components/admin/expenses/ExpenseApprovalActions';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface PendingExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  status: string;
  user_name: string;
}

interface PendingMileage {
  id: string;
  origin: string;
  destination: string;
  distance_miles: number;
  amount: number;
  trip_date: string;
  status: string;
  user_name: string;
}

async function getPendingExpenses(): Promise<{ pending: PendingExpense[]; pendingMileage: PendingMileage[]; approvedCount: number; rejectedCount: number }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { pending: [], pendingMileage: [], approvedCount: 0, rejectedCount: 0 };

    const [pendingRes, approvedRes, rejectedRes, pendingMileageRes] = await Promise.all([
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
      supabase
        .from('mileage_entries')
        .select('id, origin, destination, distance_miles, amount, trip_date, status, users(full_name)')
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .order('trip_date', { ascending: false }),
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

    const pendingMileage = (pendingMileageRes.data ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      origin: m.origin as string,
      destination: m.destination as string,
      distance_miles: m.distance_miles as number,
      amount: m.amount as number,
      trip_date: m.trip_date as string,
      status: m.status as string,
      user_name: (m.users as Record<string, string>)?.full_name ?? 'Unknown',
    }));

    return {
      pending,
      pendingMileage,
      approvedCount: approvedRes.count ?? 0,
      rejectedCount: rejectedRes.count ?? 0,
    };
  } catch {
    return { pending: [], pendingMileage: [], approvedCount: 0, rejectedCount: 0 };
  }
}

export default async function ExpenseApprovalsPage() {
  const { pending, pendingMileage, approvedCount, rejectedCount } = await getPendingExpenses();

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
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{pending.length + pendingMileage.length}</p>
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

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Expenses</h3>
          {pending.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="overflow-x-auto">
                <Table >
                  <TableHeader>
                    <TableRow className="border-b border-border bg-bg-secondary">
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Submitted By</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Category</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</TableHead>
                      <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</TableHead>
                      <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody >
                    {pending.map((exp) => (
                      <TableRow key={exp.id} className="transition-colors hover:bg-bg-secondary/50">
                        <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{exp.user_name}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{formatDate(exp.expense_date)}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-foreground capitalize">{exp.category}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{exp.description ?? '—'}</TableCell>
                        <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center">
                          <ExpenseApprovalActions expenseId={exp.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState
              message="No expenses pending approval"
              description="When team members submit expenses, they'll appear here for review."
            />
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Mileage</h3>
          {pendingMileage.length > 0 ? (
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="overflow-x-auto">
                <Table >
                  <TableHeader>
                    <TableRow className="border-b border-border bg-bg-secondary">
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Submitted By</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</TableHead>
                      <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Route</TableHead>
                      <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Miles</TableHead>
                      <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Amount</TableHead>
                      <TableHead className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody >
                    {pendingMileage.map((m) => (
                      <TableRow key={m.id} className="transition-colors hover:bg-bg-secondary/50">
                        <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{m.user_name}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{formatDate(m.trip_date)}</TableCell>
                        <TableCell className="px-6 py-3.5 text-sm text-foreground">{m.origin} → {m.destination}</TableCell>
                        <TableCell className="px-6 py-3.5 text-right text-sm text-text-secondary">{m.distance_miles}</TableCell>
                        <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(m.amount)}</TableCell>
                        <TableCell className="px-6 py-3.5 text-center">
                          <ExpenseApprovalActions expenseId={m.id} isMileage />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <EmptyState
              message="No mileage pending approval"
              description="When team members submit mileage, it will appear here for review."
            />
          )}
        </div>
      </div>
    </TierGate>
  );
}
