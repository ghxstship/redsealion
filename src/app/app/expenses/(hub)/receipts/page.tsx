import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import { TierGate } from '@/components/shared/TierGate';
import EmptyState from '@/components/ui/EmptyState';

export default function ReceiptsPage() {
  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Receipts"
        subtitle="Upload and manage receipt images for expense tracking."
      />

      <ExpensesHubTabs />

      <EmptyState
        message="No receipts uploaded"
        description="Upload receipt photos or PDFs to attach to expenses. Drag and drop or click to upload."
      />
    </TierGate>
  );
}
