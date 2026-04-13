import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { PRODUCTION_SCHEDULE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import ScheduleDetailActions from './ScheduleDetailActions';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
        <div className="flex items-center gap-3">
          <ScheduleDetailActions id={id} currentStatus={schedule.status as string} />
          <Link href="/app/schedule" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">← Back</Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Schedule Info</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd><StatusBadge status={schedule.status as string} colorMap={PRODUCTION_SCHEDULE_STATUS_COLORS} /></dd></div>
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
          <Table >
            <TableHeader >
              <TableRow><TableHead className="px-4 py-3">Title</TableHead><TableHead className="px-4 py-3">Type</TableHead><TableHead className="px-4 py-3">Start</TableHead><TableHead className="px-4 py-3">End</TableHead><TableHead className="px-4 py-3">Location</TableHead></TableRow>
            </TableHeader>
            <TableBody >
              {blocks.map((b) => (
                <TableRow key={b.id as string} className="hover:bg-bg-secondary/50">
                  <TableCell className="px-4 py-3 font-medium text-foreground">{b.title as string}</TableCell>
                  <TableCell className="px-4 py-3 text-text-secondary capitalize">{(b.block_type as string)?.replace('_', ' ')}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums text-text-secondary">{b.start_time ? new Date(b.start_time as string).toLocaleString() : '—'}</TableCell>
                  <TableCell className="px-4 py-3 tabular-nums text-text-secondary">{b.end_time ? new Date(b.end_time as string).toLocaleString() : '—'}</TableCell>
                  <TableCell className="px-4 py-3 text-text-secondary">{(b.location as string) ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </TierGate>
  );
}
