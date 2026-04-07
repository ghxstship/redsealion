import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';

export default function ExpenseApprovalsPage() {
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
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">0</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Approved This Month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">0</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Rejected</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">0</p>
        </Card>
      </div>

      <EmptyState
        message="No expenses pending approval"
        description="When team members submit expenses, they'll appear here for review."
      />
    </TierGate>
  );
}
