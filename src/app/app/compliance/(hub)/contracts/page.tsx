import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ComplianceHubTabs from '../../ComplianceHubTabs';
import { getDocsByType, ComplianceTable } from '../../compliance-shared';
import MetricCard from '@/components/ui/MetricCard';

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
        <MetricCard label={"Total Contracts"} value={docs.length} />
        <MetricCard label={"Verified"} value={verified} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Expiring Soon"} value={expiring} className="[&_.text-foreground]:text-yellow-600" />
      </div>
      <ComplianceTable docs={docs} emptyMsg="No contracts tracked yet. Add contracts from crew or vendor profiles." />
    </TierGate>
  );
}
