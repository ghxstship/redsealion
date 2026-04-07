import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import UtilizationHeatMap from '@/components/admin/workloads/UtilizationHeatMap';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import WorkloadsHubTabs from '../../WorkloadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';

interface ScheduleData {
  teamMembers: Array<{ id: string; name: string; role: string }>;
}

async function getScheduleData(): Promise<ScheduleData> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: members } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('organization_id', ctx.organizationId)
      .limit(20);

    return {
      teamMembers: (members ?? []).map((m) => ({
        id: m.id,
        name: m.full_name,
        role: m.role,
      })),
    };
  } catch {
    return { teamMembers: [] };
  }
}

export default async function SchedulePage() {
  const data = await getScheduleData();

  return (
    <TierGate feature="resource_scheduling">
      <PageHeader
        title="Workload Schedule"
        subtitle="Visualize team allocation and utilization across projects."
      />

      <WorkloadsHubTabs />

      <UtilizationHeatMap
        teamMembers={data.teamMembers}
      />
    </TierGate>
  );
}
