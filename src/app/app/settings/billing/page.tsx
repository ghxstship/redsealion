import { TierGate } from '@/components/shared/TierGate';
import PlanSelector from '@/components/admin/settings/PlanSelector';

export default function BillingPage() {
  return (
    <TierGate feature="billing">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Billing & Plans
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your subscription and billing details.
        </p>
      </div>

      <PlanSelector />
    </TierGate>
  );
}
