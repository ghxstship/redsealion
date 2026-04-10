import { TierGate } from '@/components/shared/TierGate';
import MileageForm from '@/components/admin/expenses/MileageForm';
import PageHeader from '@/components/shared/PageHeader';

export default function NewMileagePage() {
  return (
    <TierGate feature="expenses">
      <PageHeader
        title="Log Mileage"
        subtitle="Submit a new business travel mileage entry for reimbursement."
      />

      <MileageForm />
    </TierGate>
  );
}
