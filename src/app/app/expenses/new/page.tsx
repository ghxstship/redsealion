import { TierGate } from '@/components/shared/TierGate';
import ExpenseForm from '@/components/admin/expenses/ExpenseForm';

export default function NewExpensePage() {
  return (
    <TierGate feature="expenses">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Expense
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Submit a new expense for reimbursement.
        </p>
      </div>

      <ExpenseForm />
    </TierGate>
  );
}
