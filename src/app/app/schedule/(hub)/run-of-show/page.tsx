import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import ScheduleHubTabs from '../../ScheduleHubTabs';

async function getRunOfShowSchedules() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { schedules: [], blocks: [] };
    const { data: schedules } = await supabase
      .from('production_schedules')
      .select('id, name, status, start_date, events(name)')
      .eq('organization_id', ctx.organizationId)
      .eq('schedule_type', 'run_of_show')
      .order('start_date', { ascending: true });

    const ids = (schedules ?? []).map((s: { id: string }) => s.id);
    let blocks: Array<{ id: string; schedule_id: string; title: string; block_type: string; start_time: string; end_time: string; duration_minutes: number | null; notes: string | null; status: string }> = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from('schedule_blocks')
        .select('id, schedule_id, title, block_type, start_time, end_time, duration_minutes, notes, status')
        .in('schedule_id', ids)
        .order('sort_order', { ascending: true });
      blocks = (data ?? []) as typeof blocks;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return {
      schedules: (schedules ?? []).map((s: any) => ({
        id: s.id as string, name: s.name as string, status: s.status as string,
        start_date: s.start_date as string | null,
        event_name: Array.isArray(s.events) ? s.events[0]?.name : s.events?.name ?? null,
      })),
      blocks,
    };
  } catch { return { schedules: [], blocks: [] }; }
}

export default async function RunOfShowPage() {
  const { schedules, blocks } = await getRunOfShowSchedules();

  return (
    <TierGate feature="events">
      <PageHeader title="Run of Show" subtitle="Minute-by-minute rundown documents for live events." />
      <ScheduleHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Run of Show Documents</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{schedules.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Total Cues</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{blocks.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Live Now</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{schedules.filter((s) => s.status === 'live').length}</p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No Run of Show documents. Create one from an event to build your show rundown.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule) => {
            const cues = blocks.filter((b) => b.schedule_id === schedule.id);
            return (
              <div key={schedule.id} className="rounded-xl border border-border bg-white overflow-hidden">
                <div className="px-5 py-3 bg-bg-secondary border-b border-border flex items-center justify-between">
                  <div>
                    <Link href={`/app/schedule/${schedule.id}`} className="text-sm font-semibold text-foreground hover:underline">{schedule.name}</Link>
                    {schedule.event_name && <span className="text-xs text-text-muted ml-2">• {schedule.event_name}</span>}
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${schedule.status === 'live' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{schedule.status}</span>
                </div>
                {cues.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-text-muted">No cues added yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2 w-20">Time</th>
                          <th className="px-4 py-2 w-16">Dur.</th>
                          <th className="px-4 py-2">Cue</th>
                          <th className="px-4 py-2">Notes</th>
                          <th className="px-4 py-2 w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cues.map((cue) => (
                          <tr key={cue.id} className="hover:bg-bg-secondary/50 transition-colors">
                            <td className="px-4 py-2 text-xs font-mono tabular-nums text-text-secondary">{new Date(cue.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td className="px-4 py-2 text-xs tabular-nums text-text-muted">{cue.duration_minutes ? `${cue.duration_minutes}m` : '—'}</td>
                            <td className="px-4 py-2 font-medium text-foreground">{cue.title}</td>
                            <td className="px-4 py-2 text-text-secondary text-xs line-clamp-1">{cue.notes ?? '—'}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cue.status === 'completed' ? 'bg-green-50 text-green-700' : cue.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>{cue.status.replace('_', ' ')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </TierGate>
  );
}
