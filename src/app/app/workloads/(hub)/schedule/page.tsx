import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import WorkloadsHubTabs from '../../WorkloadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';

interface ScheduleAllocation {
  id: string;
  userName: string;
  projectName: string | null;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
}

async function getScheduleAllocations(): Promise<ScheduleAllocation[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const now = new Date().toISOString().split('T')[0];
    const sixWeeksLater = new Date(Date.now() + 42 * 86400000).toISOString().split('T')[0];

    const { data } = await supabase
      .from('resource_allocations')
      .select('id, start_date, end_date, hours_per_day, users!user_id(full_name), proposals(name)')
      .eq('organization_id', ctx.organizationId)
      .lte('start_date', sixWeeksLater)
      .gte('end_date', now)
      .order('start_date');

    return (data ?? []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      userName: (a.users as Record<string, unknown> | null)?.full_name as string ?? 'Unknown',
      projectName: (a.proposals as Record<string, unknown> | null)?.name as string ?? null,
      startDate: a.start_date as string,
      endDate: a.end_date as string,
      hoursPerDay: (a.hours_per_day as number) ?? 8,
    }));
  } catch {
    return [];
  }
}

function getWeeks(startDate: Date, count: number): Array<{ label: string; start: string; end: string }> {
  const weeks: Array<{ label: string; start: string; end: string }> = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(startDate.getTime() + i * 7 * 86400000);
    const end = new Date(start.getTime() + 6 * 86400000);
    weeks.push({
      label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  }
  return weeks;
}

export default async function WorkloadsSchedulePage() {
  const allocations = await getScheduleAllocations();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeks = getWeeks(weekStart, 6);

  // Group allocations by user
  const byUser = new Map<string, ScheduleAllocation[]>();
  for (const a of allocations) {
    const arr = byUser.get(a.userName) ?? [];
    arr.push(a);
    byUser.set(a.userName, arr);
  }

  return (
    <TierGate feature="resource_scheduling">
      <PageHeader
        title="Resource Schedule"
        subtitle="Visual schedule of team allocations across projects."
      >
        <Link href="/app/workloads" className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          New Allocation
        </Link>
      </PageHeader>

      <WorkloadsHubTabs />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {allocations.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No active allocations in the next 6 weeks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-bg-secondary z-10 min-w-[160px]">Team Member</th>
                  {weeks.map((w) => (
                    <th key={w.start} className="px-3 py-3 text-center min-w-[120px]">{w.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...byUser.entries()].map(([userName, userAllocations]) => (
                  <tr key={userName} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-background z-10">{userName}</td>
                    {weeks.map((week) => {
                      const active = userAllocations.filter(
                        (a) => a.startDate <= week.end && a.endDate >= week.start,
                      );
                      if (active.length === 0) {
                        return <td key={week.start} className="px-3 py-3 text-center text-text-muted">—</td>;
                      }
                      return (
                        <td key={week.start} className="px-3 py-3">
                          {active.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 mb-1 last:mb-0"
                            >
                              <p className="text-xs font-medium text-blue-800 truncate">{a.projectName ?? 'Unassigned'}</p>
                              <p className="text-[10px] text-blue-600">{a.hoursPerDay}h/day</p>
                            </div>
                          ))}
                        </td>
                      );
                    })}
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
