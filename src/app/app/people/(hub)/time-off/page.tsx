import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { statusColor } from '@/lib/utils';
import TimeOffCalendar from '@/components/admin/people/TimeOffCalendar';
import TimeOffClient from '@/components/admin/people/TimeOffClient';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PeopleHubTabs from '../../PeopleHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

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
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  let isAdmin = false;

  if (ctx) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('roles(name)')
      .eq('user_id', ctx.userId)
      .eq('organization_id', ctx.organizationId)
      .single();

    const roleMap = (membership?.roles as { name?: string } | null) ?? {};
    const roleName = roleMap.name?.toLowerCase() || '';
    isAdmin = ['owner', 'admin', 'collaborator'].includes(roleName);
  }

  return (
    <TierGate feature="time_off">
      <PageHeader
        title="Time Off"
        subtitle="Manage time-off requests and team availability."
      />

      <PeopleHubTabs />

      <div className="mb-6">
        <TimeOffCalendar requests={requests} />
      </div>

      <TimeOffClient requests={requests} isAdmin={isAdmin} />
    </TierGate>
  );
}
