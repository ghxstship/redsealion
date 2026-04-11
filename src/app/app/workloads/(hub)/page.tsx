import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import WorkloadsHubTabs from '../WorkloadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/MetricCard';
import WorkloadsActions from './WorkloadsActions';

interface ResourceStats {
  totalAllocations: number;
  teamMembers: number;
  avgUtilization: number;
}

interface AllocationRow {
  id: string;
  userName: string;
  projectName: string | null;
  hoursPerDay: number;
  startDate: string;
  endDate: string;
  role: string | null;
}

async function getResourceStats(): Promise<ResourceStats> {
  const fallback: ResourceStats = { totalAllocations: 0, teamMembers: 0, avgUtilization: 0 };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const [allocRes, teamRes, utilRes] = await Promise.all([
      supabase
        .from('resource_allocations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('resource_allocations')
        .select('allocated_hours, available_hours')
        .eq('organization_id', ctx.organizationId),
    ]);

    const rows = utilRes.data ?? [];
    const totalAllocated = rows.reduce((s, r) => s + (r.allocated_hours ?? 0), 0);
    const totalAvailable = rows.reduce((s, r) => s + (r.available_hours ?? 0), 0);
    const avgUtilization =
      totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0;

    return {
      totalAllocations: allocRes.count ?? 0,
      teamMembers: teamRes.count ?? 0,
      avgUtilization,
    };
  } catch {
    return fallback;
  }
}

async function getAllocations(): Promise<AllocationRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('resource_allocations')
      .select('id, user_id, hours_per_day, start_date, end_date, role, users!user_id(full_name), proposals(name)')
      .eq('organization_id', ctx.organizationId)
      .order('start_date', { ascending: false })
      .limit(50);

    return (data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      userName: (a.users as Record<string, unknown> | null)?.full_name as string ?? 'Unknown',
      projectName: (a.proposals as Record<string, unknown> | null)?.name as string ?? null,
      hoursPerDay: (a.hours_per_day as number) ?? 8,
      startDate: a.start_date as string,
      endDate: a.end_date as string,
      role: a.role as string | null,
    }));
  } catch {
    return [];
  }
}

export default async function WorkloadsPage() {
  const [stats, allocations] = await Promise.all([getResourceStats(), getAllocations()]);

  const cards = [
    { label: 'Active Allocations', value: String(stats.totalAllocations), detail: 'Current assignments' },
    { label: 'Team Members', value: String(stats.teamMembers), detail: 'Available resources' },
    { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, detail: 'This month' },
  ];

  return (
    <TierGate feature="resource_scheduling">
      <PageHeader
        title="Workload Management"
        subtitle="Plan workloads and allocate team members to projects."
      >
        <WorkloadsActions />
      </PageHeader>

      <WorkloadsHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {cards.map((card) => (
          <MetricCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {allocations.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">
              No resource allocations yet. Allocations will appear here once team members are scheduled to projects.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Hours/Day</th>
                  <th className="px-4 py-3">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocations.map((a) => (
                  <tr key={a.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{a.userName}</td>
                    <td className="px-4 py-3 text-text-secondary">{a.projectName ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{a.role ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{a.hoursPerDay}h</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(a.startDate).toLocaleDateString()} – {new Date(a.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
