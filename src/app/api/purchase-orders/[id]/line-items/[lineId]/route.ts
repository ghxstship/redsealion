import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string; lineId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, lineId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  // Verify PO belongs to org
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

  const allowedFields = ['description', 'quantity', 'unit_price', 'received_quantity'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  // Recalculate amount if quantity or unit_price changed
  if ('quantity' in updates || 'unit_price' in updates) {
    const { data: existing } = await supabase
      .from('purchase_order_line_items')
      .select('quantity, unit_price')
      .eq('id', lineId)
      .single();

    const qty = (updates.quantity as number) ?? (existing?.quantity ?? 1);
    const price = (updates.unit_price as number) ?? (existing?.unit_price ?? 0);
    updates.amount = qty * price;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: lineItem, error } = await supabase
    .from('purchase_order_line_items')
    .update(updates)
    .eq('id', lineId)
    .eq('po_id', id)
    .select()
    .single();

  if (error || !lineItem) return NextResponse.json({ error: 'Failed to update line item', details: error?.message }, { status: 500 });

  // Recalculate PO total
  const { data: lines } = await supabase
    .from('purchase_order_line_items')
    .select('amount')
    .eq('po_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { amount: number }) => sum + (l.amount ?? 0), 0);
  await supabase.from('purchase_orders').update({ total_amount: newTotal }).eq('id', id);

  return NextResponse.json({ success: true, line_item: lineItem });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, lineId } = await context.params;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

  const { error } = await supabase
    .from('purchase_order_line_items')
    .delete()
    .eq('id', lineId)
    .eq('po_id', id);

  if (error) return NextResponse.json({ error: 'Failed to delete line item', details: error.message }, { status: 500 });

  // Recalculate PO total
  const { data: lines } = await supabase
    .from('purchase_order_line_items')
    .select('amount')
    .eq('po_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { amount: number }) => sum + (l.amount ?? 0), 0);
  await supabase.from('purchase_orders').update({ total_amount: newTotal }).eq('id', id);

  return NextResponse.json({ success: true });
}
