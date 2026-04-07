import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import Card from '@/components/ui/Card';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';

export default function MileagePage() {
  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Mileage Tracking"
        subtitle="Log and reimburse mileage for business travel."
      />

      <ExpensesHubTabs />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Miles This Month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">0</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Rate / Mile</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">$0.70</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Reimbursement Due</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">$0.00</p>
        </Card>
      </div>

      <EmptyState
        message="No mileage entries yet"
        description="Log business travel mileage for reimbursement. Each entry can be attached to a project or client."
      />
    </TierGate>
  );
}
