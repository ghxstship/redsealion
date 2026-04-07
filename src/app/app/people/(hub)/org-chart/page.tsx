import { TierGate } from '@/components/shared/TierGate';
import OrgChart from '@/components/admin/people/OrgChart';
import PeopleHubTabs from '../../PeopleHubTabs';
import PageHeader from '@/components/shared/PageHeader';

export default function OrgChartPage() {
  return (
    <TierGate feature="org_chart">
<PageHeader
        title="Organization Chart"
        subtitle="Visualize reporting structure and team hierarchy."
      />

      <PeopleHubTabs />

      <OrgChart />
    </TierGate>
  );
}
