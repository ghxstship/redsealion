import { TierGate } from '@/components/shared/TierGate';
import ExpenseForm from '@/components/admin/expenses/ExpenseForm';
import PageHeader from '@/components/shared/PageHeader';

export default function NewExpensePage() {
  return (
    <TierGate feature="expenses">
<PageHeader
        title="New Expense"
        subtitle="Submit a new expense for reimbursement."
      />

      <ExpenseForm />
    </TierGate>
  );
}
