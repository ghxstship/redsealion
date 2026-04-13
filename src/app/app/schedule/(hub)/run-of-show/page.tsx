import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import StatusBadge, { PRODUCTION_SCHEDULE_STATUS_COLORS, SCHEDULE_BLOCK_STATUS_COLORS } from '@/components/ui/StatusBadge';
import ScheduleHubTabs from '../../ScheduleHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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

    return {
      schedules: (schedules ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string, name: s.name as string, status: s.status as string,
        start_date: s.start_date as string | null,
        event_name: Array.isArray(s.events) ? (s.events as Record<string, unknown>[])[0]?.name as string : (s.events as Record<string, unknown> | null)?.name as string ?? null,
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
        <MetricCard label={"Run of Show Documents"} value={schedules.length} />
        <MetricCard label={"Total Cues"} value={blocks.length} />
        <MetricCard label={"Live Now"} value={schedules.filter((s) => s.status === 'live').length} className="[&_.text-foreground]:text-green-600" />
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No Run of Show documents. Create one from an event to build your show rundown.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule) => {
            const cues = blocks.filter((b) => b.schedule_id === schedule.id);
            return (
              <div key={schedule.id} className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="px-5 py-3 bg-bg-secondary border-b border-border flex items-center justify-between">
                  <div>
                    <Link href={`/app/schedule/${schedule.id}`} className="text-sm font-semibold text-foreground hover:underline">{schedule.name}</Link>
                    {schedule.event_name && <span className="text-xs text-text-muted ml-2">• {schedule.event_name}</span>}
                  </div>
                  <StatusBadge status={schedule.status} colorMap={PRODUCTION_SCHEDULE_STATUS_COLORS} />
                </div>
                {cues.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-text-muted">No cues added yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table >
                      <TableHeader className="text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                        <TableRow>
                          <TableHead className="px-4 py-2 w-20">Time</TableHead>
                          <TableHead className="px-4 py-2 w-16">Dur.</TableHead>
                          <TableHead className="px-4 py-2">Cue</TableHead>
                          <TableHead className="px-4 py-2">Notes</TableHead>
                          <TableHead className="px-4 py-2 w-24">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody >
                        {cues.map((cue) => (
                          <TableRow key={cue.id} className="hover:bg-bg-secondary/50 transition-colors">
                            <TableCell className="px-4 py-2 text-xs font-mono tabular-nums text-text-secondary">{new Date(cue.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                            <TableCell className="px-4 py-2 text-xs tabular-nums text-text-muted">{cue.duration_minutes ? `${cue.duration_minutes}m` : '—'}</TableCell>
                            <TableCell className="px-4 py-2 font-medium text-foreground">{cue.title}</TableCell>
                            <TableCell className="px-4 py-2 text-text-secondary text-xs line-clamp-1">{cue.notes ?? '—'}</TableCell>
                            <TableCell className="px-4 py-2">
                              <StatusBadge status={cue.status} colorMap={SCHEDULE_BLOCK_STATUS_COLORS} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
