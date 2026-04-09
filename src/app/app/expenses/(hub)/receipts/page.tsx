import PageHeader from '@/components/shared/PageHeader';
import ExpensesHubTabs from '../../ExpensesHubTabs';
import { TierGate } from '@/components/shared/TierGate';
import ReceiptUploader from '@/components/admin/expenses/ReceiptUploader';

export default function ReceiptsPage() {
  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Receipts"
        subtitle="Upload and manage receipt images for expense tracking."
      />

      <ExpensesHubTabs />

      <div className="max-w-2xl">
        <ReceiptUploader />
      </div>
    </TierGate>
  );
}
