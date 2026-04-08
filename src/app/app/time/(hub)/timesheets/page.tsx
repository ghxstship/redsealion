import { createClient } from '@/lib/supabase/server';
import TimesheetApprovalCard from '@/components/admin/time/TimesheetApprovalCard';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TimeHubTabs from '../../TimeHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
const { data } = await supabase
      .from('timesheets')
      .select('id, user_id, week_start, total_hours, submitted_at, status')
      .eq('organization_id', ctx.organizationId)
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
    <>
<PageHeader
        title="Timesheet Approvals"
        subtitle="Review and approve submitted timesheets."
      />

      <TimeHubTabs />

      {timesheets.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
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
    </>
  );
}
