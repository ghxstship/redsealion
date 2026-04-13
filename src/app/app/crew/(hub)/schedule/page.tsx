import { formatLabel } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';


import { RoleGate } from '@/components/shared/RoleGate';
interface ScheduleEntry {
  id: string;
  crew_name: string;
  project_name: string;
  venue: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}



async function getSchedule(): Promise<ScheduleEntry[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
    const { data: bookings } = await supabase
      .from('crew_bookings')
      .select('*, crew_profiles(full_name)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .gte('shift_start', new Date().toISOString())
      .order('shift_start', { ascending: true });

    if (!bookings || bookings.length === 0) throw new Error('No bookings');

    return bookings.map((b: Record<string, unknown>) => {
      const shiftStart = b.shift_start ? new Date(b.shift_start as string) : null;
      const shiftEnd = b.shift_end ? new Date(b.shift_end as string) : null;
      return {
        id: b.id as string,
        crew_name: (b.crew_profiles as Record<string, string>)?.full_name ?? 'Unknown',
        project_name: (b.project_name as string) ?? 'Untitled',
        venue: (b.venue_name as string) ?? '—',
        date: shiftStart ? shiftStart.toISOString().split('T')[0] : '',
        start_time: shiftStart ? shiftStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        end_time: shiftEnd ? shiftEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        status: b.status as string,
      };
    });
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}


const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  tentative: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-500/10 text-red-700',
};

export default async function CrewSchedulePage() {
  const schedule = await getSchedule();

  return (
    <RoleGate resource="crew">
    <>
      <PageHeader
        title="Crew Schedule"
        subtitle={`${schedule.length} upcoming bookings`}
      />


      {/* Schedule table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border bg-bg-secondary">
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Crew</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Venue</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Shift</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {schedule.map((entry) => (
              <TableRow key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary whitespace-nowrap">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">
                  {entry.crew_name}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                  {entry.project_name}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                  {entry.venue}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">
                  {entry.start_time} &ndash; {entry.end_time}
                </TableCell>
                <TableCell className="px-6 py-3.5">
                  <StatusBadge status={entry.status} colorMap={STATUS_COLORS} />
                </TableCell>
              </TableRow>
            ))}
            {schedule.length === 0 && (
              <TableRow><TableCell colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted">No upcoming bookings.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  </RoleGate>
  );
}
