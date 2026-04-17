import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import MyScheduleHeader from '@/components/admin/my-schedule/MyScheduleHeader';
import MyScheduleView, { type ScheduleItem, type ScheduleItemType } from '@/components/admin/my-schedule/MyScheduleView';

import { RoleGate } from '@/components/shared/RoleGate';
import { createLogger } from '@/lib/logger';

const log = createLogger('my-schedule');

type ScheduleBlock = {
  title: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
};

type ProductionScheduleRef = {
  name?: string;
};

async function getMySchedule(): Promise<ScheduleItem[]> {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ctx) return [];

  const items: ScheduleItem[] = [];

  try {
    // ── 1. Tasks ───────────────────────────────────────────
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, start_time, end_time, projects(name)')
      .eq('assignee_id', user.id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .not('due_date', 'is', null);

    if (tasks) {
      for (const t of tasks) {
        const hasTime = !!t.start_time;
        items.push({
          id: `task-${t.id}`,
          type: 'task' as ScheduleItemType,
          title: t.title,
          subtitle: (t.projects as { name?: string } | null)?.name ?? 'Personal task',
          start: hasTime ? `${t.due_date}T${t.start_time}` : `${t.due_date}T09:00:00`,
          end: t.end_time ? `${t.due_date}T${t.end_time}` : undefined,
          allDay: !hasTime,
          status: t.status,
          href: `/app/tasks?id=${t.id}`,
        });
      }
    }

    // ── 2. Crew Profile (for bookings & schedule blocks) ──
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (profile) {
      // 2a. Crew Bookings
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
            type: 'shift' as ScheduleItemType,
            title: `${b.role !== 'unassigned' ? b.role : 'Shift'} — ${b.project_name || 'Project'}`,
            subtitle: b.venue_name || undefined,
            start: b.shift_start,
            end: b.shift_end || undefined,
            status: b.status,
            location: b.venue_name || undefined,
          });
        }
      }

      // 2b. Schedule Block Assignments
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
          const blockRelation = a.schedule_blocks as ScheduleBlock | ScheduleBlock[] | null;
          const block = Array.isArray(blockRelation) ? blockRelation[0] : blockRelation;
          if (!block || !block.start_time) continue;
          items.push({
            id: `block-${a.id}`,
            type: 'block' as ScheduleItemType,
            title: block.title,
            subtitle: a.role ? `Role: ${a.role}` : undefined,
            location: block.location || undefined,
            start: block.start_time,
            end: block.end_time || undefined,
          });
        }
      }
    }

    // ── 3. Events (org events) ─────────────────────────────
    const { data: events } = await supabase
      .from('events')
      .select('id, name, subtitle, starts_at, ends_at, type, status')
      .eq('organization_id', ctx.organizationId)
      .not('starts_at', 'is', null)
      .in('status', ['confirmed', 'in_progress']);

    if (events) {
      for (const e of events) {
        if (!e.starts_at) continue;
        const startDate = new Date(e.starts_at);
        const endDate = e.ends_at ? new Date(e.ends_at) : undefined;
        const isMultiDay = endDate && (endDate.getTime() - startDate.getTime()) > 24 * 60 * 60 * 1000;

        items.push({
          id: `event-${e.id}`,
          type: 'event' as ScheduleItemType,
          title: e.name,
          subtitle: e.subtitle || `${e.type} event`,
          start: e.starts_at,
          end: e.ends_at || undefined,
          allDay: isMultiDay,
          status: e.status,
          href: `/app/events/${e.id}`,
        });
      }
    }

    // ── 4. Milestones (assigned to current user) ───────────
    // First get schedule IDs for this org
    const { data: schedules } = await supabase
      .from('production_schedules')
      .select('id')
      .eq('organization_id', ctx.organizationId);

    const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);

    if (scheduleIds.length > 0) {
      const { data: milestones } = await supabase
        .from('schedule_milestones')
        .select('id, title, due_at, status, completed_at, production_schedules(name)')
        .in('schedule_id', scheduleIds)
        .or(`assigned_to.eq.${user.id},assigned_to.is.null`);

      if (milestones) {
        for (const m of milestones) {
          if (!m.due_at) continue;
          const schedule = m.production_schedules as ProductionScheduleRef | null;
          const schedName = schedule?.name;
          items.push({
            id: `milestone-${m.id}`,
            type: 'milestone' as ScheduleItemType,
            title: m.title,
            subtitle: schedName ? `Schedule: ${schedName}` : undefined,
            start: m.due_at,
            allDay: true,
            status: m.status ?? undefined,
          });
        }
      }
    }

    // ── 5. Shifts ──────────────────────────────────────────
    // Direct shifts table (proposal-linked shifts the user may be assigned to)
    if (profile) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id, name, date, start_time, end_time, call_time, notes, venues:venue_id(name)')
        .eq('organization_id', ctx.organizationId);

      if (shifts) {
        for (const s of shifts) {
          items.push({
            id: `shift-${s.id}`,
            type: 'shift' as ScheduleItemType,
            title: s.name,
            subtitle: s.call_time ? `Call time: ${s.call_time}` : undefined,
            start: `${s.date}T${s.start_time}`,
            end: `${s.date}T${s.end_time}`,
            location: (s.venues as { name?: string } | null)?.name || undefined,
          });
        }
      }
    }
  } catch (err) {
    log.error('Error fetching schedule', {}, err);
  }

  return items;
}

export default async function MySchedulePage() {
  const items = await getMySchedule();

  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'collaborator']}>
    <div>
      <MyScheduleHeader />
      <MyScheduleView items={items} />
    </div>
  </RoleGate>
  );
}
