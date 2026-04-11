import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';
import MetricCard from '@/components/ui/MetricCard';

export default async function COIsPage() {
  const docs = await getDocsByType('coi');
  const verified = docs.filter((d) => d.status === 'verified').length;
  const expired = docs.filter((d) => d.status === 'expired').length;

  return (
    <TierGate feature="compliance">
      <PageHeader title="Certificates of Insurance" subtitle="Track COIs for vendors, subcontractors, and venues." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total COIs"} value={docs.length} />
        <MetricCard label={"Verified"} value={verified} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Expired"} value={expired} className="[&_.text-foreground]:text-red-600" />
      </div>
      <ComplianceTable docs={docs} emptyMsg="No COIs on file. Upload certificates from vendor or crew profiles." />
    </TierGate>
  );
}
