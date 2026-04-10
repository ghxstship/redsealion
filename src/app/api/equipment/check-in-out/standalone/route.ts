import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'edit');
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, asset_id, event_id, rental_order_id, destination, condition, quantity, notes } = body;

  if (!asset_id) return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
  if (action !== 'check_out' && action !== 'check_in') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (action === 'check_out') {
    const { data, error } = await supabase.from('asset_checkouts').insert({
      organization_id: perm.organizationId,
      asset_id,
      event_id: event_id || null,
      rental_order_id: rental_order_id || null,
      destination: destination || null,
      checked_out_by: perm.userId,
      checked_out_at: now,
      condition_out: condition || 'good',
      quantity: quantity || 1,
      notes_out: notes || null,
      status: 'checked_out',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update asset status
    await supabase.from('assets').update({ status: 'deployed' }).eq('id', asset_id);

    return NextResponse.json({ success: true, checkout: data });
  } else {
    // Check in
    const { data: openCheckout } = await supabase
      .from('asset_checkouts')
      .select('id')
      .eq('organization_id', perm.organizationId)
      .eq('asset_id', asset_id)
      .eq('status', 'checked_out')
      .order('checked_out_at', { ascending: false })
      .limit(1)
      .single();

    if (!openCheckout) return NextResponse.json({ error: 'No open checkout found for this asset.' }, { status: 404 });

    const newStatus = condition === 'damaged' ? 'damaged_return' : condition === 'lost' ? 'lost' : 'checked_in';

    const { data: updated, error } = await supabase
      .from('asset_checkouts')
      .update({
        checked_in_by: perm.userId,
        checked_in_at: now,
        condition_in: condition || 'good',
        notes_in: notes || null,
        status: newStatus,
      })
      .eq('id', openCheckout.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update asset status back to available
    await supabase.from('assets').update({ status: 'available', condition: condition || 'good' }).eq('id', asset_id);

    return NextResponse.json({ success: true, checkout: updated });
  }
}
