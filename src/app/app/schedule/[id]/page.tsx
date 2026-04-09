import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';

async function getSchedule(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('production_schedules')
      .select('*, events(id, name), schedule_blocks(*), schedule_milestones(*)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();
    return data;
  } catch { return null; }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700',
  active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function ScheduleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schedule = await getSchedule(id);
  if (!schedule) notFound();

  const blocks = (schedule.schedule_blocks ?? []) as Array<Record<string, unknown>>;
  const milestones = (schedule.schedule_milestones ?? []) as Array<Record<string, unknown>>;
  const event = schedule.events as { id: string; name: string } | null;

  return (
    <TierGate feature="events">
      <PageHeader title={schedule.name as string} subtitle={`${schedule.schedule_type} schedule — ${schedule.status}`}>
        <Link href="/app/schedule" className="btn-secondary text-sm">← Back to Schedules</Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Schedule Info</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[schedule.status as string] ?? ''}`}>{schedule.status as string}</span></dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Type</dt><dd className="text-foreground capitalize">{(schedule.schedule_type as string)?.replace('_', ' ')}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Event</dt><dd className="text-foreground">{event ? <Link href={`/app/events/${event.id}`} className="hover:underline">{event.name}</Link> : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Start</dt><dd className="text-foreground">{schedule.start_date ? new Date(schedule.start_date as string).toLocaleDateString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">End</dt><dd className="text-foreground">{schedule.end_date ? new Date(schedule.end_date as string).toLocaleDateString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Timezone</dt><dd className="text-foreground">{schedule.timezone as string ?? '—'}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Milestones ({milestones.length})</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-text-secondary">No milestones defined.</p>
          ) : (
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.id as string} className="flex items-center justify-between text-sm">
                  <span className={`text-foreground ${m.completed_at ? 'line-through text-text-muted' : ''}`}>{m.title as string}</span>
                  <span className="text-xs text-text-muted">{m.due_at ? new Date(m.due_at as string).toLocaleDateString() : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Schedule Blocks */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Blocks ({blocks.length})</h3>
        </div>
        {blocks.length === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">No schedule blocks defined.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Location</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocks.map((b) => (
                <tr key={b.id as string} className="hover:bg-bg-secondary/50">
                  <td className="px-4 py-3 font-medium text-foreground">{b.title as string}</td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{(b.block_type as string)?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{b.start_time ? new Date(b.start_time as string).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{b.end_time ? new Date(b.end_time as string).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{(b.location as string) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
