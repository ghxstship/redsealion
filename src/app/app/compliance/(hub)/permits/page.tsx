import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';
import MetricCard from '@/components/ui/MetricCard';

export default async function PermitsPage() {
  const docs = await getDocsByType('permit');
  const verified = docs.filter((d) => d.status === 'verified').length;
  const expired = docs.filter((d) => d.status === 'expired').length;

  return (
    <TierGate feature="compliance">
      <PageHeader title="Permits" subtitle="Event permits, building permits, and regulatory approvals." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total Permits"} value={docs.length} />
        <MetricCard label={"Verified"} value={verified} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Expired"} value={expired} className="[&_.text-foreground]:text-red-600" />
      </div>
      <ComplianceTable docs={docs} emptyMsg="No permits on file. Add permits to track approval status and expiration." />
    </TierGate>
  );
}
