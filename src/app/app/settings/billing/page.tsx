import PlanSelector from '@/components/admin/settings/PlanSelector';
import PageHeader from '@/components/shared/PageHeader';

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing & Plans"
        subtitle="Manage your subscription and billing details."
      />

      <PlanSelector />
    </>
  );
}
