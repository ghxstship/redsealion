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

  if (!proposalId) {
    return NextResponse.json(
      { error: 'proposalId query parameter is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Check for existing items
  const { data: existingItems, error: itemsError } = await supabase
    .from('packing_list_items')
    .select('*')
    .eq('organization_id', orgId)
    .eq('proposal_id', proposalId)
    .order('category')
    .order('name');

  if (!itemsError && existingItems && existingItems.length > 0) {
    return NextResponse.json({ items: existingItems });
  }

  // If none exist, generate from equipment_reservations
  const { data: reservations } = await supabase
    .from('equipment_reservations')
    .select('*, asset:assets(id, name, category)')
    .eq('organization_id', orgId)
    .eq('proposal_id', proposalId);

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const newItems = reservations.map((r) => {
    const asset = castRelation<{ id: string; name: string; category: string }>(r.asset);
    return {
      organization_id: orgId,
      proposal_id: proposalId,
      equipment_id: asset?.id ?? (r.asset_id as string),
      name: asset?.name ?? 'Unknown',
      category: asset?.category ?? 'Uncategorized',
      quantity: (r.quantity as number) ?? 1,
      packed: false,
    };
  });

  const { data: insertedItems } = await supabase
    .from('packing_list_items')
    .insert(newItems)
    .select();

  return NextResponse.json({ items: insertedItems ?? newItems });
}

