import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * PATCH /api/equipment/maintenance/[id]
 * Update a maintenance record — supports completion with actual cost and failure tracking.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('equipment', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const allowedFields = [
    'status', 'description', 'scheduled_date', 'completed_date',
    'cost', 'performed_by', 'notes', 'type',
  ];

  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch current record
  const { data: existing } = await supabase
    .from('maintenance_records')
    .select('id, asset_id, type, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Maintenance record not found.' }, { status: 404 });
  }

  // If completing a repair-type record, update asset's last_failure_at
  if (updates.status === 'completed' && (existing.type === 'Repair' || existing.type === 'repair')) {
    await supabase
      .from('assets')
      .update({ last_failure_at: new Date().toISOString() })
      .eq('id', existing.asset_id)
      .eq('organization_id', perm.organizationId);
  }

  // Auto-set completed_date if completing
  if (updates.status === 'completed' && !updates.completed_date) {
    updates.completed_date = new Date().toISOString().split('T')[0];
  }

  const { data: record, error } = await supabase
    .from('maintenance_records')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !record) {
    return NextResponse.json({ error: 'Failed to update maintenance record.', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, record });
}
