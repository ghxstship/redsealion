import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/PageHeader';
import MyScheduleView, { ScheduleItem } from '@/components/admin/my-schedule/MyScheduleView';

async function getMySchedule(): Promise<ScheduleItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const items: ScheduleItem[] = [];

  try {
    // 1. Fetch Tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, start_time, end_time, projects(name)')
      .eq('assignee_id', user.id)
      .is('deleted_at', null)
      .not('due_date', 'is', null);

    if (tasks) {
      for (const t of tasks) {
        // Construct a start time based on due_date and start_time if present
        let start = `${t.due_date}T09:00:00Z`; // default to 9am UTC if no time
        if (t.start_time) {
          start = `${t.due_date}T${t.start_time}Z`;
        }
        
        let end = undefined;
        if (t.end_time) {
          end = `${t.due_date}T${t.end_time}Z`;
        }

        items.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: (t.projects as any)?.name ?? 'Personal task',
          start,
          end,
        });
      }
    }

    // 2. Fetch Crew Profile to get bookings and blocks
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', user.id)
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
