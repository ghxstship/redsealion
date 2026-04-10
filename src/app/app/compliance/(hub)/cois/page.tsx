import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';

export default async function COIsPage() {
  const docs = await getDocsByType('coi');
  const verified = docs.filter((d) => d.status === 'verified').length;
  const expired = docs.filter((d) => d.status === 'expired').length;

  return (
    <TierGate feature="compliance">
      <PageHeader title="Certificates of Insurance" subtitle="Track COIs for vendors, subcontractors, and venues." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total COIs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{docs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Verified</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{verified}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Expired</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600">{expired}</p>
        </div>
      </div>
      <ComplianceTable docs={docs} emptyMsg="No COIs on file. Upload certificates from vendor or crew profiles." />
    </TierGate>
  );
}
