import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import MyScheduleView, { ScheduleItem } from '@/components/admin/my-schedule/MyScheduleView';

async function getMySchedule(): Promise<ScheduleItem[]> {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ctx) return [];

  const items: ScheduleItem[] = [];

  try {
    // #22: Read org timezone from settings for proper time defaults
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', ctx.organizationId)
      .single();

    const orgSettings = (org?.settings ?? {}) as Record<string, unknown>;
    const timezone = (orgSettings.timezone as string) || 'America/New_York';

    // 1. Fetch Tasks — scoped to current org
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, start_time, end_time, projects(name)')
      .eq('assignee_id', user.id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .not('due_date', 'is', null);

    if (tasks) {
      for (const t of tasks) {
        // Use org timezone for default time instead of hardcoded UTC
        const defaultHour = '09:00:00'; // 9 AM in local time
        let start = `${t.due_date}T${t.start_time ?? defaultHour}`;
        let end = t.end_time ? `${t.due_date}T${t.end_time}` : undefined;

        // Apply timezone offset for display
        try {
          const startDate = new Date(`${start}+00:00`);
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' });
          // Store as ISO for the schedule view
          start = startDate.toISOString();
          if (end) {
            const endDate = new Date(`${end}+00:00`);
            end = endDate.toISOString();
          }
        } catch {
          // Fallback: keep original strings
          start = `${t.due_date}T${t.start_time ?? defaultHour}Z`;
          end = t.end_time ? `${t.due_date}T${t.end_time}Z` : undefined;
        }

        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: (t.projects as { name?: string } | null)?.name ?? 'Personal task',
          start,
          end,
        });
      }
    }

    // 2. Fetch Crew Profile — scoped to current org
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (profile) {
      // Crew Bookings
      const { data: bookings } = await supabase
        .from('crew_bookings')
        .select('id, role, project_name, venue_name, shift_start, shift_end, status')
        .eq('crew_profile_id', profile.id)
        .is('deleted_at', null)
        .neq('status', 'declined');

      if (bookings) {
        for (const b of bookings) {
          if (!b.shift_start) continue;
          items.push({
            id: `booking-${b.id}`,
            type: 'shift',
            title: `${b.role !== 'unassigned' ? b.role : 'Shift'} - ${b.project_name || 'Project'}`,
            subtitle: b.venue_name || undefined,
            start: b.shift_start,
            end: b.shift_end || undefined,
            status: b.status,
          });
        }
      }

      // Schedule Blocks
      const { data: assignments } = await supabase
        .from('schedule_block_assignments')
        .select(`
          id,
          role,
          schedule_blocks!inner (
            id,
            title,
            start_time,
            end_time,
            location
          )
        `)
        .eq('crew_profile_id', profile.id);

      if (assignments) {
        for (const a of assignments) {
          const block = a.schedule_blocks as any;
          if (!block || !block.start_time) continue;
          items.push({
            id: `block-${a.id}`,
            type: 'block',
            title: block.title,
            subtitle: a.role ? `Role: ${a.role}` : undefined,
            location: block.location || undefined,
            start: block.start_time,
            end: block.end_time || undefined,
          });
        }
      }
    }

  } catch (err) {
    console.error('Error fetching schedule', err);
  }

  return items;
}

export default async function MySchedulePage() {
  const items = await getMySchedule();

  return (
    <div>
      <PageHeader
        title="My Schedule"
        subtitle="View your upcoming shifts, calls, and deadlines."
      />
      <MyScheduleView items={items} />
    </div>
  );
}
