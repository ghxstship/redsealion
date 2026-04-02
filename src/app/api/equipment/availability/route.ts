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

  const { searchParams } = request.nextUrl;
  const assetId = searchParams.get('assetId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!assetId || !from || !to) {
    return NextResponse.json(
      { error: 'assetId, from, and to query parameters are required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch the asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', assetId)
    .single();

  if (assetError || !asset) {
    return NextResponse.json(
      { error: 'Asset not found.', details: assetError?.message },
      { status: 404 },
    );
  }

  // Fetch overlapping reservations in the date range
  // A reservation overlaps if it starts before the range ends AND ends after the range starts
  const { data: reservations, error: resError } = await supabase
    .from('equipment_reservations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('asset_id', assetId)
    .not('status', 'in', '("cancelled","returned")')
    .lte('reserved_from', to)
    .gte('reserved_until', from);

  if (resError) {
    return NextResponse.json(
      { error: 'Failed to check availability.', details: resError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    asset,
    reservations: reservations ?? [],
    available: (reservations ?? []).length === 0,
  });
}
