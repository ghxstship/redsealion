import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';

export default async function LicensesPage() {
  const docs = await getDocsByType('license');
  const expired = docs.filter((d) => d.status === 'expired').length;

  return (
    <TierGate feature="crew">
      <PageHeader title="Licenses" subtitle="Business and professional licenses across your organization." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Total Licenses</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Active</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{docs.length - expired}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Expired</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600">{expired}</p>
        </div>
      </div>
      <ComplianceTable docs={docs} emptyMsg="No licenses tracked. Add licenses to monitor renewal dates." />
    </TierGate>
  );
}
