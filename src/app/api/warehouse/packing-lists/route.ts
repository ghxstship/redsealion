import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { castRelation } from '@/lib/supabase/cast-relation';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const proposalId = url.searchParams.get('proposalId');
  const locationId = url.searchParams.get('locationId') ?? url.searchParams.get('venueId');
  const eventId = url.searchParams.get('eventId');

  if (!proposalId && !eventId) {
    return NextResponse.json(
      { error: 'proposalId or eventId query parameter is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch equipment reservations
  let query = supabase
    .from('equipment_reservations')
    .select('*, asset:assets(id, name, category, serial_number)')
    .eq('organization_id', orgId);

  if (proposalId) query = query.eq('proposal_id', proposalId);
  if (eventId) query = query.eq('event_id', eventId);
  if (locationId) query = query.eq('venue_id', locationId);

  const { data: reservations, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch equipment reservations.', details: error.message },
      { status: 500 },
    );
  }

  // Group by category
  const grouped: Record<
    string,
    Array<{
      asset_id: string;
      name: string;
      serial_number: string | null;
      quantity: number;
    }>
  > = {};

  for (const r of reservations ?? []) {
    const asset = castRelation<{
      id: string;
      name: string;
      category: string;
      serial_number: string | null;
    }>(r.asset);

    const category = asset?.category ?? 'Uncategorized';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push({
      asset_id: asset?.id ?? (r.asset_id as string),
      name: asset?.name ?? 'Unknown',
      serial_number: asset?.serial_number ?? null,
      quantity: (r.quantity as number) ?? 1,
    });
  }

  return NextResponse.json({
    proposal_id: proposalId,
    location_id: locationId,
    categories: grouped,
    total_items: (reservations ?? []).length,
  });
}
