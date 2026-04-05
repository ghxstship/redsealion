import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

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

const fallbackSchedule: ScheduleEntry[] = [
  { id: 'sch_001', crew_name: 'Alex Rivera', project_name: 'Nike SNKRS Fest 2026', venue: 'Convention Center Hall A', date: '2026-04-15', start_time: '08:00', end_time: '18:00', status: 'confirmed' },
  { id: 'sch_002', crew_name: 'Jordan Lee', project_name: 'Nike SNKRS Fest 2026', venue: 'Convention Center Hall A', date: '2026-04-15', start_time: '10:00', end_time: '20:00', status: 'confirmed' },
  { id: 'sch_003', crew_name: 'Sam Patel', project_name: 'Samsung Galaxy Unpacked', venue: 'Barclays Center', date: '2026-04-22', start_time: '06:00', end_time: '16:00', status: 'tentative' },
  { id: 'sch_004', crew_name: 'Morgan Chen', project_name: 'Samsung Galaxy Unpacked', venue: 'Barclays Center', date: '2026-04-22', start_time: '07:00', end_time: '17:00', status: 'confirmed' },
  { id: 'sch_005', crew_name: 'Alex Rivera', project_name: 'Samsung Galaxy Unpacked', venue: 'Barclays Center', date: '2026-04-22', start_time: '08:00', end_time: '18:00', status: 'confirmed' },
  { id: 'sch_006', crew_name: 'Taylor Brooks', project_name: 'Spotify Wrapped Live', venue: 'Pier 17', date: '2026-05-10', start_time: '09:00', end_time: '19:00', status: 'tentative' },
  { id: 'sch_007', crew_name: 'Jordan Lee', project_name: 'Spotify Wrapped Live', venue: 'Pier 17', date: '2026-05-10', start_time: '10:00', end_time: '22:00', status: 'confirmed' },
];

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
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (!bookings || bookings.length === 0) throw new Error('No bookings');

    return bookings.map((b: Record<string, unknown>) => ({
      id: b.id as string,
      crew_name: (b.crew_profiles as Record<string, string>)?.full_name ?? 'Unknown',
      project_name: b.project_name as string,
      venue: b.venue as string,
      date: b.date as string,
      start_time: b.start_time as string,
      end_time: b.end_time as string,
      status: b.status as string,
    }));
  } catch {
    return fallbackSchedule;
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

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  tentative: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default async function CrewSchedulePage() {
  const schedule = await getSchedule();

  // Group by date
  const groupedByDate = new Map<string, ScheduleEntry[]>();
  for (const entry of schedule) {
    const arr = groupedByDate.get(entry.date);
    if (arr) {
      arr.push(entry);
    } else {
      groupedByDate.set(entry.date, [entry]);
    }
  }

  const sortedDates = Array.from(groupedByDate.keys()).sort();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Crew Schedule
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Upcoming bookings grouped by date.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/crew"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Directory
          </Link>
          <Link
            href="/app/crew/availability"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Availability
          </Link>
        </div>
      </div>

      {/* Schedule by date */}
      <div className="space-y-6">
        {sortedDates.map((date) => {
          const entries = groupedByDate.get(date)!;
          return (
            <div key={date}>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                {formatDate(date)}
              </h2>
              <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Crew</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Shift</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                        <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                          {entry.crew_name}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-text-secondary">
                          {entry.project_name}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-text-secondary">
                          {entry.venue}
                        </td>
                        <td className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">
                          {entry.start_time} &ndash; {entry.end_time}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[entry.status] ?? 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {formatLabel(entry.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {sortedDates.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center text-sm text-text-muted">
            No upcoming bookings.
          </div>
        )}
      </div>
    </>
  );
}
