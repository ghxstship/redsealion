import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import type { CrewBooking, CrewBookingStatus } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const proposalId = url.searchParams.get('proposalId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('crew_bookings')
    .select('*')
    .eq('crew_profile_id', id)
    .eq('organization_id', orgId)
    .order('shift_start', { ascending: true });

  if (proposalId) {
    query = query.eq('proposal_id', proposalId);
  }
  if (from) {
    query = query.gte('shift_start', from);
  }
  if (to) {
    query = query.lte('shift_start', to);
  }

  const { data: bookings, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookings.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ bookings: bookings ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    proposal_id,
    venue_id,
    role,
    shift_start,
    shift_end,
    call_time,
    rate_type,
    rate_amount,
    notes,
  } = body as {
    proposal_id?: string;
    venue_id?: string;
    role?: string;
    shift_start?: string;
    shift_end?: string;
    call_time?: string;
    rate_type?: string;
    rate_amount?: number;
    notes?: string;
  };

  if (!shift_start || !shift_end) {
    return NextResponse.json(
      { error: 'shift_start and shift_end are required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Check for overlapping bookings (conflict detection)
  const { data: conflicts, error: conflictError } = await supabase
    .from('crew_bookings')
    .select('*')
    .eq('crew_profile_id', id)
    .eq('organization_id', orgId)
    .not('status', 'in', '("declined","cancelled")')
    .lt('shift_start', shift_end)
    .gt('shift_end', shift_start);

  if (conflictError) {
    return NextResponse.json(
      { error: 'Failed to check booking conflicts.', details: conflictError.message },
      { status: 500 },
    );
  }

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      {
        error: 'Booking conflict detected.',
        conflicts,
      },
      { status: 409 },
    );
  }

  const { data: booking, error: insertError } = await supabase
    .from('crew_bookings')
    .insert({
      organization_id: orgId,
      crew_profile_id: id,
      proposal_id: proposal_id ?? null,
      venue_id: venue_id ?? null,
      role: role ?? null,
      shift_start,
      shift_end,
      call_time: call_time ?? null,
      rate_type: rate_type ?? null,
      rate_amount: rate_amount ?? null,
      notes: notes ?? null,
      status: 'confirmed',
    })
    .select()
    .single();

  if (insertError || !booking) {
    return NextResponse.json(
      { error: 'Failed to create booking.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, booking });
}
