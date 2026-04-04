import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import type { AssetCondition } from '@/types/database';

export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { reservation_id, action, condition, notes } = body as {
    reservation_id?: string;
    action?: 'check_out' | 'check_in';
    condition?: AssetCondition;
    notes?: string;
  };

  if (!reservation_id) {
    return NextResponse.json({ error: 'reservation_id is required.' }, { status: 400 });
  }

  if (!action || (action !== 'check_out' && action !== 'check_in')) {
    return NextResponse.json(
      { error: 'action must be "check_out" or "check_in".' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch the reservation scoped to the org
  const { data: reservation, error: fetchError } = await supabase
    .from('equipment_reservations')
    .select()
    .eq('organization_id', orgId)
    .eq('id', reservation_id)
    .single();

  if (fetchError || !reservation) {
    return NextResponse.json(
      { error: 'Reservation not found.', details: fetchError?.message },
      { status: 404 },
    );
  }

  if (action === 'check_out') {
    if (reservation.status !== 'reserved') {
      return NextResponse.json(
        { error: `Cannot check out: reservation status is "${reservation.status}".` },
        { status: 400 },
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('equipment_reservations')
      .update({
        status: 'checked_out',
        checked_out_by: perm.userId,
        checked_out_at: new Date().toISOString(),
        notes: notes || reservation.notes,
      })
      .eq('id', reservation_id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to check out.', details: updateError?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, reservation: updated });
  }

  // action === 'check_in'
  if (reservation.status !== 'checked_out') {
    return NextResponse.json(
      { error: `Cannot check in: reservation status is "${reservation.status}".` },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('equipment_reservations')
    .update({
      status: 'returned',
      returned_by: perm.userId,
      returned_at: new Date().toISOString(),
      condition_on_return: condition || null,
      notes: notes || reservation.notes,
    })
    .eq('id', reservation_id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: 'Failed to check in.', details: updateError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, reservation: updated });
}
