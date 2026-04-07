import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * PATCH /api/purchase-orders/[id]/receive
 * Marks a PO as received and optionally auto-creates asset records.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('profitability');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    create_assets = false,
    asset_items,
  } = body as {
    create_assets?: boolean;
    asset_items?: Array<{
      name: string;
      type?: string;
      category?: string;
      quantity?: number;
      unit_cost?: number;
    }>;
  };

  const supabase = await createClient();

  // Fetch PO
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!po) {
    return NextResponse.json({ error: 'Purchase order not found.' }, { status: 404 });
  }

  // Update PO status to received
  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({ status: 'received' })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update PO status.', details: updateError.message }, { status: 500 });
  }

  let createdAssets: { id: string; name: string }[] = [];

  // Auto-create assets if requested
  if (create_assets && asset_items && asset_items.length > 0) {
    const assetsToCreate = asset_items.map((item) => ({
      organization_id: perm.organizationId,
      proposal_id: po.proposal_id || null,
      name: item.name,
      type: item.type || 'equipment',
      category: item.category || 'Other',
      status: 'planned' as const,
      condition: 'new' as const,
      is_trackable: true,
      is_reusable: true,
      acquisition_cost: item.unit_cost ?? (po.total_amount / (asset_items.length || 1)),
      current_value: item.unit_cost ?? (po.total_amount / (asset_items.length || 1)),
      deployment_count: 0,
      vendor_name: po.vendor_name,
      purchase_order_id: id,
      photo_urls: [],
    }));

    const { data: newAssets, error: assetError } = await supabase
      .from('assets')
      .insert(assetsToCreate)
      .select('id, name');

    if (assetError) {
      return NextResponse.json({
        success: true,
        po_status: 'received',
        asset_error: `PO received but asset creation failed: ${assetError.message}`,
        created_assets: [],
      });
    }

    createdAssets = (newAssets ?? []) as { id: string; name: string }[];

    // Record value history for each created asset
    for (const asset of createdAssets) {
      const matchingItem = assetsToCreate.find((a) => a.name === asset.name);
      await supabase.from('asset_value_history').insert({
        asset_id: asset.id,
        organization_id: perm.organizationId,
        previous_value: 0,
        new_value: matchingItem?.acquisition_cost ?? 0,
        change_type: 'acquisition',
        reason: `Created from PO ${po.po_number}`,
        changed_by: perm.userId,
      });
    }
  }

  return NextResponse.json({
    success: true,
    po_status: 'received',
    created_assets: createdAssets,
  });
}
