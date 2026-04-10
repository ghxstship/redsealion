import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';

export default async function ContractsPage() {
  const docs = await getDocsByType('contract');
  const verified = docs.filter((d) => d.status === 'verified').length;
  const expiring = docs.filter((d) => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return exp > new Date() && exp <= new Date(Date.now() + 30 * 86400000);
  }).length;

  return (
    <TierGate feature="compliance">
      <PageHeader title="Contracts" subtitle="Vendor and crew contracts, NDAs, and service agreements." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Contracts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Verified</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{verified}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Expiring Soon</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-yellow-600">{expiring}</p>
        </div>
      </div>
      <ComplianceTable docs={docs} emptyMsg="No contracts tracked yet. Add contracts from crew or vendor profiles." />
    </TierGate>
  );
}
