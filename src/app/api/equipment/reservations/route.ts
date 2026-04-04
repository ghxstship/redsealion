import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('equipment', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('equipment_reservations')
    .select()
    .eq('organization_id', orgId)
    .order('reserved_from', { ascending: true });

  const proposalId = searchParams.get('proposalId');
  if (proposalId) {
    query = query.eq('proposal_id', proposalId);
  }

  const assetId = searchParams.get('assetId');
  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  const { data: reservations, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch reservations.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ reservations });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    asset_id,
    proposal_id,
    venue_id,
    quantity,
    reserved_from,
    reserved_until,
    notes,
  } = body as {
    asset_id?: string;
    proposal_id?: string;
    venue_id?: string;
    quantity?: number;
    reserved_from?: string;
    reserved_until?: string;
    notes?: string;
  };

  if (!asset_id || !proposal_id || !reserved_from || !reserved_until) {
    return NextResponse.json(
      { error: 'asset_id, proposal_id, reserved_from, and reserved_until are required.' },
      { status: 400 },
    );
  }

  if (quantity == null || quantity < 1) {
    return NextResponse.json(
      { error: 'quantity is required and must be >= 1.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Check for overlapping reservations (same asset, overlapping dates, active status)
  const { data: conflicts, error: conflictError } = await supabase
    .from('equipment_reservations')
    .select('id, reserved_from, reserved_until, status')
    .eq('organization_id', orgId)
    .eq('asset_id', asset_id)
    .not('status', 'in', '("cancelled","returned")')
    .lte('reserved_from', reserved_until)
    .gte('reserved_until', reserved_from);

  if (conflictError) {
    return NextResponse.json(
      { error: 'Failed to check for conflicts.', details: conflictError.message },
      { status: 500 },
    );
  }

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      {
        error: 'Scheduling conflict: overlapping reservation exists.',
        conflicts,
      },
      { status: 409 },
    );
  }

  const { data: reservation, error: insertError } = await supabase
    .from('equipment_reservations')
    .insert({
      organization_id: orgId,
      asset_id,
      proposal_id,
      venue_id: venue_id || null,
      quantity,
      reserved_from,
      reserved_until,
      status: 'reserved',
      notes: notes || null,
    })
    .select()
    .single();

  if (insertError || !reservation) {
    return NextResponse.json(
      { error: 'Failed to create reservation.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, reservation });
}
