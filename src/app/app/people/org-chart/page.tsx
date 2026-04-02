import { TierGate } from '@/components/shared/TierGate';
import OrgChart from '@/components/admin/people/OrgChart';

export default function OrgChartPage() {
  return (
    <TierGate feature="org_chart">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Organization Chart
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Visualize reporting structure and team hierarchy.
        </p>
      </div>

      <OrgChart />
    </TierGate>
  );
}
