import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';
import MetricCard from '@/components/ui/MetricCard';

export default async function LicensesPage() {
  const docs = await getDocsByType('license');
  const verified = docs.filter((d) => d.status === 'verified').length;
  const expired = docs.filter((d) => d.status === 'expired').length;

  return (
    <TierGate feature="compliance">
      <PageHeader title="Licenses" subtitle="Business and professional licenses across your organization." />
      <ComplianceHubTabs />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total Licenses"} value={docs.length} />
        <MetricCard label={"Verified"} value={verified} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Expired"} value={expired} className="[&_.text-foreground]:text-red-600" />
      </div>
      <ComplianceTable docs={docs} emptyMsg="No licenses tracked. Add licenses to monitor renewal dates." />
    </TierGate>
  );
}
