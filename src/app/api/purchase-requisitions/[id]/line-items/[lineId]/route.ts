import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string; lineId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, lineId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  // Verify requisition belongs to org
  const { data: req } = await supabase
    .from('purchase_requisitions')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  const allowedFields = ['description', 'quantity', 'unit_cost_cents', 'vendor_id', 'status'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: lineItem, error } = await supabase
    .from('requisition_line_items')
    .update(updates)
    .eq('id', lineId)
    .eq('requisition_id', id)
    .select()
    .single();

  if (error || !lineItem) return NextResponse.json({ error: 'Failed to update line item', details: error?.message }, { status: 500 });

  // Recalculate requisition total
  const { data: lines } = await supabase
    .from('requisition_line_items')
    .select('quantity, unit_cost_cents')
    .eq('requisition_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { quantity: number; unit_cost_cents: number }) => sum + (l.quantity * l.unit_cost_cents), 0);
  await supabase.from('purchase_requisitions').update({ total_cents: newTotal }).eq('id', id);

  return NextResponse.json({ success: true, line_item: lineItem });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, lineId } = await context.params;
  const supabase = await createClient();

  const { data: req } = await supabase
    .from('purchase_requisitions')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  const { error } = await supabase
    .from('requisition_line_items')
    .delete()
    .eq('id', lineId)
    .eq('requisition_id', id);

  if (error) return NextResponse.json({ error: 'Failed to delete line item', details: error.message }, { status: 500 });

  // Recalculate requisition total
  const { data: lines } = await supabase
    .from('requisition_line_items')
    .select('quantity, unit_cost_cents')
    .eq('requisition_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { quantity: number; unit_cost_cents: number }) => sum + (l.quantity * l.unit_cost_cents), 0);
  await supabase.from('purchase_requisitions').update({ total_cents: newTotal }).eq('id', id);

  return NextResponse.json({ success: true });
}
