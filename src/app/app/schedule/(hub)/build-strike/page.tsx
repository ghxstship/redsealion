import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import ScheduleHubTabs from '../../ScheduleHubTabs';

async function getBuildStrikeSchedules() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { schedules: [], blocks: [] };
    const { data: schedules } = await supabase
      .from('production_schedules')
      .select('id, name, status, start_date, end_date, events(name)')
      .eq('organization_id', ctx.organizationId)
      .eq('schedule_type', 'build_strike')
      .order('start_date', { ascending: true });

    const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);
    let blocks: Array<{ id: string; schedule_id: string; title: string; block_type: string; start_time: string; end_time: string; status: string; location: string | null }> = [];
    if (scheduleIds.length > 0) {
      const { data: blockData } = await supabase
        .from('schedule_blocks')
        .select('id, schedule_id, title, block_type, start_time, end_time, status, location')
        .in('schedule_id', scheduleIds)
        .order('sort_order', { ascending: true });
      blocks = (blockData ?? []) as typeof blocks;
    }

    return {
      schedules: (schedules ?? []).map((s: Record<string, unknown>) => ({
        id: s.id as string, name: s.name as string, status: s.status as string,
        start_date: s.start_date as string | null, end_date: s.end_date as string | null,
        event_name: Array.isArray(s.events) ? (s.events as Record<string, unknown>[])[0]?.name as string : (s.events as Record<string, unknown> | null)?.name as string ?? null,
      })),
      blocks,
    };
  } catch { return { schedules: [], blocks: [] }; }
}

const BLOCK_COLORS: Record<string, string> = {
  load_in: 'border-l-blue-500 bg-blue-50', build: 'border-l-orange-500 bg-orange-50',
  rehearsal: 'border-l-purple-500 bg-purple-50', show: 'border-l-green-500 bg-green-50',
  strike: 'border-l-red-500 bg-red-50', load_out: 'border-l-gray-500 bg-bg-secondary',
  transition: 'border-l-yellow-500 bg-yellow-50', break: 'border-l-gray-300 bg-bg-secondary',
  custom: 'border-l-indigo-500 bg-indigo-50',
};

export default async function BuildStrikePage() {
  const { schedules, blocks } = await getBuildStrikeSchedules();

  return (
    <TierGate feature="events">
      <PageHeader title="Build & Strike" subtitle="Load-in, build, and strike phase timelines for all events." />
      <ScheduleHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Build & Strike Schedules</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{schedules.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Blocks</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{blocks.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">In Progress</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-600">{blocks.filter((b) => b.status === 'in_progress').length}</p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No Build & Strike schedules. Create one from an event to define load-in, build, and strike phases.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule) => {
            const scheduleBlocks = blocks.filter((b) => b.schedule_id === schedule.id);
            return (
              <div key={schedule.id} className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="px-5 py-3 bg-bg-secondary border-b border-border flex items-center justify-between">
                  <div>
                    <Link href={`/app/schedule/${schedule.id}`} className="text-sm font-semibold text-foreground hover:underline">{schedule.name}</Link>
                    {schedule.event_name && <span className="text-xs text-text-muted ml-2">• {schedule.event_name}</span>}
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${schedule.status === 'live' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{schedule.status}</span>
                </div>
                {scheduleBlocks.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-text-muted">No blocks defined yet</div>
                ) : (
                  <div className="divide-y divide-border">
                    {scheduleBlocks.map((block) => (
                      <div key={block.id} className={`px-5 py-3 border-l-4 ${BLOCK_COLORS[block.block_type] ?? BLOCK_COLORS.custom}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{block.title}</p>
                            <p className="text-xs text-text-muted capitalize">{block.block_type.replace('_', ' ')}{block.location ? ` • ${block.location}` : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary">{new Date(block.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(block.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${block.status === 'completed' ? 'bg-green-50 text-green-700' : block.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-bg-secondary text-text-secondary'}`}>{block.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
