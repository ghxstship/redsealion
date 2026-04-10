import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: receipt, error } = await supabase
    .from('goods_receipts')
    .select('*, purchase_orders(id, po_number, vendor_name, vendor_id, vendors(name)), users!received_by(full_name), goods_receipt_line_items(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

  return NextResponse.json({ receipt });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['status', 'notes', 'received_date'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: receipt, error } = await supabase
    .from('goods_receipts')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !receipt) return NextResponse.json({ error: 'Failed to update receipt', details: error?.message }, { status: 500 });

  logAuditAction({
    orgId: perm.organizationId,
    action: 'goods_receipt.updated',
    entity: 'goods_receipt',
    entityId: id,
    metadata: updates,
  }).catch(() => {});

  return NextResponse.json({ success: true, receipt });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('goods_receipts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete receipt', details: error.message }, { status: 500 });

  logAuditAction({
    orgId: perm.organizationId,
    action: 'goods_receipt.deleted',
    entity: 'goods_receipt',
    entityId: id,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
