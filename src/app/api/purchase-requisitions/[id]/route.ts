import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: requisition, error } = await supabase
    .from('purchase_requisitions')
    .select('*, requisition_line_items(*, vendors(id, name), purchase_orders(id, po_number))')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !requisition) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  return NextResponse.json({ requisition });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['status', 'priority', 'needed_by', 'notes', 'total_cents'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  // Auto-set approver on approval
  if (updates.status === 'approved') {
    updates.approved_by = perm.userId;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: requisition, error } = await supabase
    .from('purchase_requisitions')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !requisition) return NextResponse.json({ error: 'Failed to update requisition', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, requisition });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('purchase_requisitions')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete requisition', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
