import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { generateICalendar, type ICalEvent } from '@/lib/utils/ical';
import { createLogger } from '@/lib/logger';

const log = createLogger('schedule:export');

/**
 * GET /api/my-schedule/export
 * Returns an .ics file containing all schedule items for the current user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events: ICalEvent[] = [];

    // ── Tasks ──────────────────────────────────────────────
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
        events.push({
          uid: `task-${t.id}@flytedeck.app`,
          summary: `[Task] ${t.title}`,
          description: (t.projects as { name?: string } | null)?.name ?? undefined,
          dtstart: hasTime ? new Date(`${t.due_date}T${t.start_time}Z`) : new Date(`${t.due_date}T09:00:00Z`),
          dtend: t.end_time ? new Date(`${t.due_date}T${t.end_time}Z`) : undefined,
          allDay: !hasTime,
          categories: ['Task'],
          url: `${process.env.NEXT_PUBLIC_APP_URL}/app/tasks?id=${t.id}`,
        });
      }
    }

    // ── Crew Bookings ──────────────────────────────────────
    const { data: profile } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (profile) {
      const { data: bookings } = await supabase
        .from('crew_bookings')
        .select('id, role, project_name, venue_name, shift_start, shift_end')
        .eq('crew_profile_id', profile.id)
        .is('deleted_at', null)
        .neq('status', 'declined');

      if (bookings) {
        for (const b of bookings) {
          if (!b.shift_start) continue;
          events.push({
            uid: `booking-${b.id}@flytedeck.app`,
            summary: `[Shift] ${b.role !== 'unassigned' ? b.role : 'Shift'} — ${b.project_name || 'Project'}`,
            location: b.venue_name || undefined,
            dtstart: new Date(b.shift_start),
            dtend: b.shift_end ? new Date(b.shift_end) : undefined,
            categories: ['Shift'],
          });
        }
      }
    }

    // ── Events ─────────────────────────────────────────────
    const { data: orgEvents } = await supabase
      .from('events')
      .select('id, name, subtitle, starts_at, ends_at, type')
      .eq('organization_id', ctx.organizationId)
      .not('starts_at', 'is', null)
      .in('status', ['confirmed', 'in_progress']);

    if (orgEvents) {
      for (const e of orgEvents) {
        if (!e.starts_at) continue;
        events.push({
          uid: `event-${e.id}@flytedeck.app`,
          summary: `[Event] ${e.name}`,
          description: e.subtitle || undefined,
          dtstart: new Date(e.starts_at),
          dtend: e.ends_at ? new Date(e.ends_at) : undefined,
          categories: ['Event'],
          url: `${process.env.NEXT_PUBLIC_APP_URL}/app/events/${e.id}`,
        });
      }
    }

    // ── Milestones ─────────────────────────────────────────
    const { data: schedules } = await supabase
      .from('production_schedules')
      .select('id')
      .eq('organization_id', ctx.organizationId);

    const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);

    if (scheduleIds.length > 0) {
      const { data: milestones } = await supabase
        .from('schedule_milestones')
        .select('id, title, due_at, production_schedules(name)')
        .in('schedule_id', scheduleIds)
        .or(`assigned_to.eq.${user.id},assigned_to.is.null`);

      if (milestones) {
        for (const m of milestones) {
          if (!m.due_at) continue;
          const schedule = m.production_schedules as { name?: string } | null;
          events.push({
            uid: `milestone-${m.id}@flytedeck.app`,
            summary: `[Milestone] ${m.title}`,
            description: schedule?.name ? `Schedule: ${schedule.name}` : undefined,
            dtstart: new Date(m.due_at),
            allDay: true,
            categories: ['Milestone'],
          });
        }
      }
    }

    // ── Generate .ics ──────────────────────────────────────
    const icsContent = generateICalendar(events);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="flytedeck-schedule.ics"',
      },
    });
  } catch (error) {
    log.error('Schedule export error', {}, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
