import { TierGate } from '@/components/shared/TierGate';
import PlanSelector from '@/components/admin/settings/PlanSelector';
import PageHeader from '@/components/shared/PageHeader';

export default function BillingPage() {
  return (
    <TierGate feature="billing">
<PageHeader
        title="Billing & Plans"
        subtitle="Manage your subscription and billing details."
      />

      <PlanSelector />
    </TierGate>
  );
}
