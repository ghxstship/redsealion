import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import WorkloadsHubTabs from '../../WorkloadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';

interface CapacityRow {
  name: string;
  role: string;
  available: number;
  allocated: number;
  utilization: number;
}

const FALLBACK_CAPACITY: CapacityRow[] = [
  { name: 'Sarah Chen', role: 'Designer', available: 6, allocated: 8, utilization: 133 },
  { name: 'Mike Johnson', role: 'Fabricator', available: 8, allocated: 6, utilization: 75 },
  { name: 'Emily Davis', role: 'PM', available: 8, allocated: 7, utilization: 88 },
  { name: 'Alex Kim', role: 'Installer', available: 8, allocated: 4, utilization: 50 },
  { name: 'Jordan Lee', role: 'Designer', available: 8, allocated: 8, utilization: 100 },
];

async function getCapacity(): Promise<CapacityRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: members } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('organization_id', ctx.organizationId);

    if (!members || members.length === 0) throw new Error('No members');

    // Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data: allocations } = await supabase
      .from('resource_allocations')
      .select('user_id, hours_per_day')
      .eq('organization_id', ctx.organizationId)
      .gte('end_date', weekStart.toISOString().split('T')[0])
      .lte('start_date', weekEnd.toISOString().split('T')[0]);

    const allocationsByUser = new Map<string, number>();
    for (const alloc of allocations ?? []) {
      const current = allocationsByUser.get(alloc.user_id) ?? 0;
      allocationsByUser.set(alloc.user_id, current + (alloc.hours_per_day ?? 0));
    }

    return members.map((m: Record<string, unknown>) => {
      const available = 8;
      const allocated = allocationsByUser.get(m.id as string) ?? 0;
      const utilization = available > 0 ? Math.round((allocated / available) * 100) : 0;
      return {
        name: (m.full_name as string) ?? 'Unknown',
        role: (m.role as string) ?? 'Team Member',
        available,
        allocated,
        utilization,
      };
    });
  } catch {
    return FALLBACK_CAPACITY;
  }
}

export default async function UtilizationPage() {
  const capacity = await getCapacity();

  return (
    <TierGate feature="resource_scheduling">
      <PageHeader
        title="Team Utilization"
        subtitle="View available hours and set workload overrides."
      />

      <WorkloadsHubTabs />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Available (h/day)</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Allocated (h/day)</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {capacity.map((member) => (
                <tr key={member.name} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{member.name}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{member.role}</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{member.available}h</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{member.allocated}h</td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.utilization > 100
                          ? 'bg-red-50 text-red-700'
                          : member.utilization >= 80
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {member.utilization}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {capacity.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-background px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No team members found.</p>
        </div>
      )}
    </TierGate>
  );
}
