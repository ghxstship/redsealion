import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import TimesheetApprovalCard from '@/components/admin/time/TimesheetApprovalCard';

interface PendingTimesheet {
  id: string;
  userName: string;
  weekStart: string;
  totalHours: number;
  submittedAt: string;
  status: string;
}

async function getPendingTimesheets(): Promise<PendingTimesheet[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    const { data } = await supabase
      .from('timesheets')
      .select('id, user_id, week_start, total_hours, submitted_at, status')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((t) => t.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', userIds);

    const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return data.map((t) => ({
      id: t.id,
      userName: userMap.get(t.user_id) ?? 'Unknown',
      weekStart: t.week_start,
      totalHours: t.total_hours,
      submittedAt: t.submitted_at ?? t.week_start,
      status: t.status,
    }));
  } catch {
    return [];
  }
}

export default async function TimesheetsApprovalPage() {
  const timesheets = await getPendingTimesheets();

  return (
    <TierGate feature="time_tracking">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Timesheet Approvals
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Review and approve submitted timesheets.
        </p>
      </div>

      {timesheets.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">
            No timesheets pending approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {timesheets.map((ts) => (
            <TimesheetApprovalCard
              key={ts.id}
              id={ts.id}
              userName={ts.userName}
              weekStart={ts.weekStart}
              totalHours={ts.totalHours}
              submittedAt={ts.submittedAt}
            />
          ))}
        </div>
      )}
    </TierGate>
  );
}
