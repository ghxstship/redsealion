import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { MILESTONE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import ScheduleHubTabs from '../../ScheduleHubTabs';
import AddMilestoneButton from './AddMilestoneButton';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getMilestones() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    // First fetch schedule IDs for this org to prevent cross-org data leakage
    const { data: schedules } = await supabase
      .from('production_schedules')
      .select('id')
      .eq('organization_id', ctx.organizationId);

    const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);
    if (scheduleIds.length === 0) return [];

    const { data } = await supabase
      .from('schedule_milestones')
      .select('id, title, due_at, completed_at, status, schedule_id, production_schedules(name)')
      .in('schedule_id', scheduleIds)
      .order('due_at', { ascending: true });

    return (data ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string, title: m.title as string,
      due_at: m.due_at as string, completed_at: m.completed_at as string | null,
      status: m.status as string,
      schedule_name: Array.isArray(m.production_schedules) ? (m.production_schedules as Record<string, unknown>[])[0]?.name as string : (m.production_schedules as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}

export default async function MilestonesPage() {
  const milestones = await getMilestones();
  const pending = milestones.filter((m) => m.status === 'pending');
  const completed = milestones.filter((m) => m.status === 'completed');
  const missed = milestones.filter((m) => m.status === 'missed');

  return (
    <TierGate feature="events">
      <PageHeader title="Milestones" subtitle="Track critical deadlines across all production schedules.">
        <AddMilestoneButton schedules={milestones.reduce<Array<{ id: string; name: string }>>((acc, m) => {
          if (!acc.find((s) => s.name === m.schedule_name)) acc.push({ id: (m as any).schedule_id ?? m.id, name: m.schedule_name ?? 'Unknown' });
          return acc;
        }, [])} />
      </PageHeader>
      <ScheduleHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total', value: milestones.length },
          { label: 'Pending', value: pending.length, color: 'text-yellow-600' },
          { label: 'Completed', value: completed.length, color: 'text-green-600' },
          { label: 'Missed', value: missed.length, color: 'text-red-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {milestones.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No milestones defined. Add milestones to production schedules to track critical deadlines.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Milestone</TableHead>
                  <TableHead className="px-4 py-3">Schedule</TableHead>
                  <TableHead className="px-4 py-3">Due</TableHead>
                  <TableHead className="px-4 py-3">Completed</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {milestones.map((m) => (
                  <TableRow key={m.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{m.title}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{m.schedule_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{formatDate(m.due_at)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{m.completed_at ? formatDate(m.completed_at) : '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={m.status} colorMap={MILESTONE_STATUS_COLORS} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
