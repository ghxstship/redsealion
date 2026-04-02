import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

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
  const venueId = url.searchParams.get('venueId');

  if (!proposalId || !venueId) {
    return NextResponse.json(
      { error: 'proposalId and venueId query parameters are required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch equipment reservations for the venue
  const { data: reservations, error } = await supabase
    .from('equipment_reservations')
    .select('*, asset:assets(id, name, category, serial_number)')
    .eq('organization_id', orgId)
    .eq('proposal_id', proposalId)
    .eq('venue_id', venueId);

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
    const asset = r.asset as unknown as {
      id: string;
      name: string;
      category: string;
      serial_number: string | null;
    } | null;

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
    venue_id: venueId,
    categories: grouped,
    total_items: (reservations ?? []).length,
  });
}
