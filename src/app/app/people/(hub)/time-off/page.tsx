import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { statusColor } from '@/lib/utils';
import TimeOffCalendar from '@/components/admin/people/TimeOffCalendar';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PeopleHubTabs from '../../PeopleHubTabs';

interface TimeOffRow {
  id: string;
  userName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
}

async function getTimeOffRequests(): Promise<TimeOffRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('time_off_requests')
      .select('id, user_id, start_date, end_date, days_requested, reason, status')
      .eq('organization_id', ctx.organizationId)
      .order('start_date', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds);

    const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return data.map((r) => ({
      id: r.id,
      userName: nameMap.get(r.user_id) ?? 'Unknown',
      startDate: r.start_date,
      endDate: r.end_date,
      days: r.days_requested,
      reason: r.reason,
      status: r.status,
    }));
  } catch {
    return [];
  }
}

export default async function TimeOffPage() {
  const requests = await getTimeOffRequests();

  return (
    <TierGate feature="time_off">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Time Off</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage time-off requests and team availability.</p>
      </div>

      <PeopleHubTabs />

      <div className="mb-8">
        <TimeOffCalendar />
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No time-off requests.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Dates</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{req.userName}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{req.days}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{req.reason ?? '-'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(req.status)}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
