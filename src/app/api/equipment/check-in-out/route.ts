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

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('equipment_reservations')
      .update({
        status: 'checked_out',
        checked_out_by: perm.userId,
        checked_out_at: now,
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

    // Write to unified asset_checkouts (SSOT custody log)
    try {
      const assetId = (reservation as Record<string, unknown>).asset_id as string | undefined;
      const eventId = (reservation as Record<string, unknown>).event_id as string | undefined;
      const rentalOrderId = (reservation as Record<string, unknown>).rental_order_id as string | undefined;
      if (assetId) {
        await supabase.from('asset_checkouts').insert({
          organization_id: orgId,
          asset_id: assetId,
          event_id: eventId ?? null,
          rental_order_id: rentalOrderId ?? null,
          checked_out_by: perm.userId,
          checked_out_at: now,
          condition_out: condition || 'good',
          quantity: ((reservation as Record<string, unknown>).quantity as number) ?? 1,
          serial_number: (reservation as Record<string, unknown>).serial_number as string ?? null,
          barcode: (reservation as Record<string, unknown>).barcode as string ?? null,
          destination: (reservation as Record<string, unknown>).destination as string ?? null,
          notes_out: notes || null,
          status: 'checked_out',
        });
      }
    } catch { /* non-critical: reservation update is primary */ }

    return NextResponse.json({ success: true, reservation: updated });
  }

  // action === 'check_in'
  if (reservation.status !== 'checked_out') {
    return NextResponse.json(
      { error: `Cannot check in: reservation status is "${reservation.status}".` },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('equipment_reservations')
    .update({
      status: 'returned',
      returned_by: perm.userId,
      returned_at: now,
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

  // Update the asset_checkouts record (close out the custody entry)
  try {
    const assetId = (reservation as Record<string, unknown>).asset_id as string | undefined;
    if (assetId) {
      // Find the most recent open checkout for this asset
      const { data: openCheckout } = await supabase
        .from('asset_checkouts')
        .select('id')
        .eq('organization_id', orgId)
        .eq('asset_id', assetId)
        .eq('status', 'checked_out')
        .order('checked_out_at', { ascending: false })
        .limit(1)
        .single();

      if (openCheckout) {
        await supabase
          .from('asset_checkouts')
          .update({
            checked_in_by: perm.userId,
            checked_in_at: now,
            condition_in: condition || 'good',
            notes_in: notes || null,
            status: condition === 'damaged' ? 'damaged_return' : 'checked_in',
          })
          .eq('id', openCheckout.id);
      }
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ success: true, reservation: updated });
}
