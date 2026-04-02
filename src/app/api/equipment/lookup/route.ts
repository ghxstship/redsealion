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

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const id = searchParams.get('id');

  if (!barcode && !id) {
    return NextResponse.json(
      { error: 'Provide a "barcode" or "id" query parameter.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Look up the equipment asset
  let query = supabase
    .from('assets')
    .select('*')
    .eq('organization_id', orgId);

  if (id) {
    query = query.eq('id', id);
  } else if (barcode) {
    // Try barcode field first, fall back to serial_number
    query = query.or(`barcode.eq.${barcode},serial_number.eq.${barcode}`);
  }

  const { data: assets, error: fetchError } = await query.limit(1);

  if (fetchError) {
    return NextResponse.json(
      { error: 'Database error.', details: fetchError.message },
      { status: 500 },
    );
  }

  if (!assets || assets.length === 0) {
    return NextResponse.json(
      { error: 'Asset not found.', barcode, id },
      { status: 404 },
    );
  }

  const asset = assets[0];

  // Fetch current active reservation if any
  const { data: reservations } = await supabase
    .from('equipment_reservations')
    .select('id, status, project_id, start_date, end_date, checked_out_at, checked_out_by')
    .eq('organization_id', orgId)
    .eq('equipment_id', asset.id)
    .in('status', ['reserved', 'checked_out'])
    .order('start_date', { ascending: false })
    .limit(1);

  return NextResponse.json({
    asset,
    activeReservation: reservations?.[0] ?? null,
  });
}
