import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ScheduleHubTabs from '../../ScheduleHubTabs';

async function getMilestones() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('schedule_milestones')
      .select('id, title, due_at, completed_at, status, production_schedules(name)')
      .eq('production_schedules.organization_id', ctx.organizationId)
      .order('due_at', { ascending: true });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((m: any) => ({
      id: m.id as string, title: m.title as string,
      due_at: m.due_at as string, completed_at: m.completed_at as string | null,
      status: m.status as string,
      schedule_name: Array.isArray(m.production_schedules) ? m.production_schedules[0]?.name : m.production_schedules?.name ?? null,
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
      <PageHeader title="Milestones" subtitle="Track critical deadlines across all production schedules." />
      <ScheduleHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total', value: milestones.length },
          { label: 'Pending', value: pending.length, color: 'text-yellow-600' },
          { label: 'Completed', value: completed.length, color: 'text-green-600' },
          { label: 'Missed', value: missed.length, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {milestones.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No milestones defined. Add milestones to production schedules to track critical deadlines.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {milestones.map((m) => (
                <tr key={m.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{m.schedule_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(m.due_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-text-secondary">{m.completed_at ? new Date(m.completed_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'completed' ? 'bg-green-50 text-green-700' : m.status === 'missed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
