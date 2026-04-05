import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateICalFeed } from '@/lib/calendar/ical';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET() {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const supabase = await createClient();
  const orgId = ctx.organizationId;

  // Fetch proposals with venue info
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, name, event_start, event_end, status')
    .eq('organization_id', orgId)
    .not('event_start', 'is', null);

  // Fetch venues linked to proposals
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, proposal_id, load_in_date, load_in_time, strike_date, strike_time')
    .eq('organization_id', orgId);

  // Fetch crew bookings for this user
  const { data: bookings } = await supabase
    .from('crew_bookings')
    .select('id, proposal_id, role, start_date, end_date, start_time, end_time, proposals(name)')
    .eq('organization_id', orgId)
    .eq('user_id', ctx.userId);

  const events: Array<{
    uid: string;
    summary: string;
    dtstart: string;
    dtend: string;
    location?: string;
    description?: string;
  }> = [];

  // Add proposal events
  for (const p of proposals ?? []) {
    if (p.event_start && p.event_end) {
      events.push({
        uid: `proposal-${p.id}@flytedeck`,
        summary: p.name ?? 'Untitled Proposal',
        dtstart: p.event_start,
        dtend: p.event_end,
        description: `Status: ${p.status}`,
      });
    }
  }

  // Add venue load-in / strike events
  for (const v of venues ?? []) {
    if (v.load_in_date) {
      events.push({
        uid: `venue-loadin-${v.id}@flytedeck`,
        summary: `Load-In: ${v.name}`,
        dtstart: `${v.load_in_date}T${v.load_in_time || '08:00:00'}`,
        dtend: `${v.load_in_date}T${v.load_in_time || '08:00:00'}`,
        location: v.name,
      });
    }
    if (v.strike_date) {
      events.push({
        uid: `venue-strike-${v.id}@flytedeck`,
        summary: `Strike: ${v.name}`,
        dtstart: `${v.strike_date}T${v.strike_time || '08:00:00'}`,
        dtend: `${v.strike_date}T${v.strike_time || '08:00:00'}`,
        location: v.name,
      });
    }
  }

  // Add crew bookings
  for (const b of bookings ?? []) {
    if (b.start_date && b.end_date) {
      const proposalName =
        (b.proposals as unknown as { name: string } | null)?.name ?? 'Project';
      events.push({
        uid: `booking-${b.id}@flytedeck`,
        summary: `${b.role ?? 'Crew'} - ${proposalName}`,
        dtstart: `${b.start_date}T${b.start_time || '08:00:00'}`,
        dtend: `${b.end_date}T${b.end_time || '18:00:00'}`,
        description: `Role: ${b.role}`,
      });
    }
  }

  const ical = generateICalFeed(events);

  return new Response(ical, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="flytedeck.ics"',
    },
  });
}
