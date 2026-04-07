import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { isValidTransition, getMissingTransitionFields } from '@/lib/assets/transitions';
import type { AssetStatus } from '@/types/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from('assets')
    .select('*, asset_location_history(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  return NextResponse.json({ asset });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  // Fetch current asset for transition validation
  const { data: existing } = await supabase
    .from('assets')
    .select('status, current_location, current_value')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!existing) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  // ── Status transition enforcement ─────────────────────────────
  if ('status' in body && body.status !== existing.status) {
    const from = existing.status as AssetStatus;
    const to = body.status as AssetStatus;

    if (!isValidTransition(from, to)) {
      return NextResponse.json(
        { error: `Invalid status transition: "${from}" → "${to}".` },
        { status: 400 },
      );
    }

    const missing = getMissingTransitionFields(to, body);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields for "${to}" transition: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    // Auto-set timestamps for terminal states
    if (to === 'retired' && !body.retired_at) {
      body.retired_at = new Date().toISOString();
    }
    if (to === 'disposed' && !body.disposed_at) {
      body.disposed_at = new Date().toISOString();
    }
  }

  // ── Build update payload ──────────────────────────────────────
  const allowedFields = [
    'name', 'type', 'category', 'is_trackable', 'status', 'condition',
    'is_reusable', 'barcode', 'serial_number', 'acquisition_cost', 'current_location',
    'description', 'deployment_count', 'current_value', 'dimensions', 'weight',
    'material', 'storage_requirements', 'depreciation_method', 'useful_life_months',
    'max_deployments', 'is_return_required', 'photo_urls',
    // New lifecycle fields
    'warranty_start_date', 'warranty_end_date', 'warranty_provider',
    'vendor_name', 'purchase_order_id',
    'insurance_policy_number', 'insurance_expiry_date',
    'disposed_at', 'disposal_method', 'disposal_reason', 'disposal_proceeds',
    'retired_at', 'total_usage_hours', 'last_failure_at',
  ];

  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  // ── Location history ──────────────────────────────────────────
  if ('current_location' in updates && existing.current_location) {
    await supabase.from('asset_location_history').insert({
      asset_id: id,
      from_location: existing.current_location,
      to_location: updates.current_location,
      moved_by: perm.userId,
      moved_at: new Date().toISOString(),
    });
  }

  // ── Value history audit ───────────────────────────────────────
  if ('current_value' in updates && existing.current_value != null) {
    const newVal = updates.current_value as number;
    if (newVal !== existing.current_value) {
      await supabase.from('asset_value_history').insert({
        asset_id: id,
        organization_id: perm.organizationId,
        previous_value: existing.current_value,
        new_value: newVal,
        change_type: 'revaluation',
        reason: (body.revaluation_reason as string) || null,
        changed_by: perm.userId,
      });
    }
  }

  // ── Audit log for status changes ──────────────────────────────
  if ('status' in updates && updates.status !== existing.status) {
    await supabase.from('asset_audit_log').insert({
      asset_id: id,
      organization_id: perm.organizationId,
      field_changed: 'status',
      old_value: existing.status,
      new_value: updates.status as string,
      changed_by: perm.userId,
      change_source: 'api',
    });
  }

  // ── Persist ───────────────────────────────────────────────────
  const { data: asset, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !asset) return NextResponse.json({ error: 'Failed to update asset', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, asset });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('assets').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete asset', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
