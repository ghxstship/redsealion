import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * POST /api/assets/[id]/revalue
 * Record a revaluation with audit trail.
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
  const { new_value, reason } = body as { new_value?: number; reason?: string };

  if (new_value == null || new_value < 0) {
    return NextResponse.json({ error: 'new_value is required and must be >= 0.' }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ error: 'reason is required for revaluation.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch current value
  const { data: asset } = await supabase
    .from('assets')
    .select('id, current_value, name')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const previousValue = asset.current_value ?? 0;
  const changeType = new_value > previousValue ? 'revaluation' : 'impairment';

  // Record value history
  await supabase.from('asset_value_history').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    previous_value: previousValue,
    new_value,
    change_type: changeType,
    reason,
    changed_by: perm.userId,
  });

  // Record audit log
  await supabase.from('asset_audit_log').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    field_changed: 'current_value',
    old_value: String(previousValue),
    new_value: String(new_value),
    changed_by: perm.userId,
    change_source: 'api',
  });

  // Update asset
  const { data: updated, error } = await supabase
    .from('assets')
    .update({ current_value: new_value })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Failed to revalue asset.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    asset: updated,
    revaluation: {
      previousValue,
      newValue: new_value,
      changeType,
      reason,
    },
  });
}
