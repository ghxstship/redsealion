import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { WORK_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import WorkOrderActions from './WorkOrderActions';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getWorkOrder(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;
    const { data } = await supabase
      .from('work_orders')
      .select('*, work_order_assignments(*, crew_profiles(id, full_name)), events(id, name), proposals(id, name), tasks(id, title)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();
    return data;
  } catch { return null; }
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wo = await getWorkOrder(id);
  if (!wo) notFound();

  const assignments = (wo.work_order_assignments ?? []) as Array<Record<string, unknown>>;
  const event = wo.events as { id: string; name: string } | null;
  const proposal = wo.proposals as { id: string; name: string } | null;
  const checklist = (wo.checklist ?? []) as Array<{ text: string; done: boolean }>;

  return (
    <TierGate feature="work_orders">
      <PageHeader title={wo.wo_number as string} subtitle={wo.title as string}>
        <div className="flex items-center gap-3">
          <WorkOrderActions id={id} currentStatus={wo.status as string} />
          <Link href="/app/work-orders" className="btn-secondary text-sm">← Work Orders</Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Work Order Info */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Status</dt><dd><StatusBadge status={wo.status as string} colorMap={WORK_ORDER_STATUS_COLORS} /></dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Priority</dt><dd className={`font-medium capitalize ${PRIORITY_COLORS[wo.priority as string] ?? ''}`}>{wo.priority as string}</dd></div>
            {event && <div className="flex justify-between"><dt className="text-text-muted">Event</dt><dd><Link href={`/app/events/${event.id}`} className="text-foreground hover:underline">{event.name}</Link></dd></div>}
            {proposal && <div className="flex justify-between"><dt className="text-text-muted">Proposal</dt><dd><Link href={`/app/proposals/${proposal.id}`} className="text-foreground hover:underline">{proposal.name}</Link></dd></div>}
            <div className="flex justify-between"><dt className="text-text-muted">Location</dt><dd className="text-foreground">{(wo.location_name as string) ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Address</dt><dd className="text-foreground text-right max-w-[200px]">{(wo.location_address as string) ?? '—'}</dd></div>
          </dl>
          {wo.description && <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4">{wo.description as string}</p>}
        </div>

        {/* Schedule & Completion */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Schedule</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-text-muted">Estimated Hours</dt><dd className="text-foreground tabular-nums">{wo.estimated_hours != null ? `${wo.estimated_hours}h` : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Scheduled Start</dt><dd className="text-foreground">{wo.scheduled_start ? new Date(wo.scheduled_start as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Scheduled End</dt><dd className="text-foreground">{wo.scheduled_end ? new Date(wo.scheduled_end as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Actual Start</dt><dd className="text-foreground">{wo.actual_start ? new Date(wo.actual_start as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Actual End</dt><dd className="text-foreground">{wo.actual_end ? new Date(wo.actual_end as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Dispatched At</dt><dd className="text-foreground">{wo.dispatched_at ? new Date(wo.dispatched_at as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Completed At</dt><dd className="text-foreground">{wo.completed_at ? new Date(wo.completed_at as string).toLocaleString() : '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-text-muted">Completed At</dt><dd className="text-foreground">{wo.completed_at ? new Date(wo.completed_at as string).toLocaleString() : '—'}</dd></div>
          </dl>
          {wo.completion_notes && <p className="mt-4 text-sm text-text-secondary border-t border-border pt-4"><strong>Completion Notes:</strong> {wo.completion_notes as string}</p>}
        </div>
      </div>

      {/* Crew Assignments */}
      <div className="rounded-xl border border-border bg-background overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Crew Assignments ({assignments.length})</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-text-secondary">No crew assigned.</div>
        ) : (
          <Table >
            <TableHeader >
              <TableRow><TableHead className="px-4 py-3">Name</TableHead><TableHead className="px-4 py-3">Role</TableHead><TableHead className="px-4 py-3">Status</TableHead><TableHead className="px-4 py-3">Assigned</TableHead></TableRow>
            </TableHeader>
            <TableBody >
              {assignments.map((a) => {
                const crew = a.crew_profiles as { id: string; full_name: string } | null;
                return (
                  <TableRow key={a.id as string} className="hover:bg-bg-secondary/50">
                    <TableCell className="px-4 py-3 text-foreground">{crew?.full_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{(a.role as string) ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={a.status as string} colorMap={WORK_ORDER_STATUS_COLORS} /></TableCell>
                    <TableCell className="px-4 py-3 text-text-muted text-xs">{a.assigned_at ? formatDate(a.assigned_at as string) : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Checklist */}
      {checklist.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Checklist ({checklist.filter(c => c.done).length}/{checklist.length} complete)</h3>
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className={`h-4 w-4 rounded border ${item.done ? 'bg-green-500 border-green-500 text-white' : 'border-border'} flex items-center justify-center text-xs`}>
                  {item.done ? '✓' : ''}
                </span>
                <span className={item.done ? 'line-through text-text-muted' : 'text-foreground'}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </TierGate>
  );
}
