import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { isValidTransition } from '@/lib/assets/transitions';
import type { AssetStatus } from '@/types/database';

/**
 * POST /api/assets/[id]/dispose
 * Formal disposal workflow with P&L calculation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    disposal_method,
    disposal_reason,
    disposal_proceeds = 0,
  } = body as {
    disposal_method?: string;
    disposal_reason?: string;
    disposal_proceeds?: number;
  };

  if (!disposal_method) {
    return NextResponse.json({ error: 'disposal_method is required (sale, scrap, donate, transfer, write_off).' }, { status: 400 });
  }

  if (!disposal_reason) {
    return NextResponse.json({ error: 'disposal_reason is required.' }, { status: 400 });
  }

  const validMethods = ['sale', 'scrap', 'donate', 'transfer', 'write_off'];
  if (!validMethods.includes(disposal_method)) {
    return NextResponse.json({ error: `Invalid disposal_method. Must be one of: ${validMethods.join(', ')}` }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch current asset
  const { data: asset } = await supabase
    .from('assets')
    .select('id, name, status, current_value, acquisition_cost')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // Validate transition
  const currentStatus = asset.status as AssetStatus;
  if (!isValidTransition(currentStatus, 'disposed')) {
    // Try retiring first if it's a valid path
    if (isValidTransition(currentStatus, 'retired')) {
      // Auto-retire then dispose
    } else {
      return NextResponse.json(
        { error: `Cannot dispose asset with status "${currentStatus}". Must be in_storage or retired first.` },
        { status: 400 },
      );
    }
  }

  const bookValue = asset.current_value ?? 0;
  const profitLoss = disposal_proceeds - bookValue;

  // Record value history
  await supabase.from('asset_value_history').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    previous_value: bookValue,
    new_value: 0,
    change_type: 'disposal',
    reason: `${disposal_method}: ${disposal_reason}. Proceeds: $${disposal_proceeds}. P&L: $${profitLoss.toFixed(2)}`,
    changed_by: perm.userId,
  });

  // Audit log
  await supabase.from('asset_audit_log').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    field_changed: 'status',
    old_value: currentStatus,
    new_value: 'disposed',
    changed_by: perm.userId,
    change_source: 'api',
  });

  // Update asset
  const { data: updated, error } = await supabase
    .from('assets')
    .update({
      status: 'disposed',
      disposed_at: new Date().toISOString(),
      disposal_method,
      disposal_reason,
      disposal_proceeds,
      current_value: 0,
    })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Failed to dispose asset.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    asset: updated,
    disposal: {
      method: disposal_method,
      reason: disposal_reason,
      proceeds: disposal_proceeds,
      bookValueAtDisposal: bookValue,
      profitLoss,
    },
  });
}
