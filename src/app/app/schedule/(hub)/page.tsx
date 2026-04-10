import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import ScheduleHubTabs from '../ScheduleHubTabs';

async function getSchedules() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('production_schedules')
      .select('id, name, schedule_type, status, start_date, end_date, events(name)')
      .eq('organization_id', ctx.organizationId)
      .order('start_date', { ascending: true });
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      schedule_type: r.schedule_type as string,
      status: r.status as string,
      start_date: r.start_date as string | null,
      end_date: r.end_date as string | null,
      event_name: Array.isArray(r.events) ? (r.events as Record<string, unknown>[])[0]?.name as string : (r.events as Record<string, unknown> | null)?.name as string ?? null,
    }));
  } catch { return []; }
}

const TYPE_LABELS: Record<string, string> = { build_strike: 'Build & Strike', run_of_show: 'Run of Show', rehearsal: 'Rehearsal', general: 'General' };
const STATUS_COLORS: Record<string, string> = { draft: 'bg-yellow-50 text-yellow-700', published: 'bg-blue-50 text-blue-700', live: 'bg-green-50 text-green-700', completed: 'bg-bg-secondary text-text-secondary' };

export default async function ScheduleTimelinePage() {
  const schedules = await getSchedules();
  const byStatus = schedules.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <TierGate feature="events">
      <PageHeader title="Production Schedule" subtitle="Manage build & strike timelines, run of show documents, and milestones across all events.">
        <Link href="/app/schedule/new" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          New Schedule
        </Link>
      </PageHeader>
      <ScheduleHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Schedules', value: schedules.length },
          { label: 'Draft', value: byStatus['draft'] ?? 0, color: 'text-yellow-600' },
          { label: 'Published', value: byStatus['published'] ?? 0, color: 'text-blue-600' },
          { label: 'Live', value: byStatus['live'] ?? 0, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {schedules.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No production schedules created yet. Create a schedule from an event to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/schedule/${s.id}`} className="font-medium text-foreground hover:underline">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{s.event_name ?? '—'}</td>
                    <td className="px-4 py-3"><span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700">{TYPE_LABELS[s.schedule_type] ?? s.schedule_type}</span></td>
                    <td className="px-4 py-3 text-text-secondary">{s.start_date ? `${new Date(s.start_date).toLocaleDateString()} – ${s.end_date ? new Date(s.end_date).toLocaleDateString() : ''}` : '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>{s.status}</span></td>
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
