import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import WeeklyTimesheet from '@/components/admin/time/WeeklyTimesheet';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TimeHubTabs from '../TimeHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/MetricCard';

interface TimeStats {
  hoursThisWeek: number;
  billableHours: number;
  pendingApproval: number;
  activeTimer: boolean;
}

async function getTimeStats(): Promise<TimeStats> {
  const fallback: TimeStats = {
    hoursThisWeek: 0,
    billableHours: 0,
    pendingApproval: 0,
    activeTimer: false,
  };

  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fallback;
// Get current week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);

    const [entriesRes, pendingRes, timerRes] = await Promise.all([
      supabase
        .from('time_entries')
        .select('duration_minutes, billable')
        .eq('user_id', ctx.userId)
        .gte('start_time', weekStart.toISOString()),
      supabase
        .from('timesheets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'submitted'),
      supabase
        .from('time_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ctx.userId)
        .is('end_time', null),
    ]);

    const entries = entriesRes.data ?? [];
    const totalMinutes = entries.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const billableMinutes = entries
      .filter((e) => e.billable)
      .reduce((s, e) => s + (e.duration_minutes ?? 0), 0);

    return {
      hoursThisWeek: Math.round((totalMinutes / 60) * 10) / 10,
      billableHours: Math.round((billableMinutes / 60) * 10) / 10,
      pendingApproval: pendingRes.count ?? 0,
      activeTimer: (timerRes.count ?? 0) > 0,
    };
  } catch {
    return fallback;
  }
}

export default async function TimePage() {
  const stats = await getTimeStats();

  const cards = [
    { label: 'Hours This Week', value: `${stats.hoursThisWeek}h`, detail: 'Current week total' },
    { label: 'Billable Hours', value: `${stats.billableHours}h`, detail: 'Billable this week' },
    { label: 'Pending Approval', value: String(stats.pendingApproval), detail: 'Timesheets to review' },
    { label: 'Active Timer', value: stats.activeTimer ? 'Running' : 'Stopped', detail: stats.activeTimer ? 'Timer is active' : 'No active timer' },
  ];

  return (
    <TierGate feature="time_tracking">
      <PageHeader
        title="Time Tracking"
        subtitle="Log hours and manage weekly timesheets."
      />

      <TimeHubTabs pendingCount={stats.pendingApproval} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((card) => (
          <MetricCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <WeeklyTimesheet />
    </TierGate>
  );
}
