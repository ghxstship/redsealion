import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify PO belongs to org
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('purchase_order_line_items')
    .select('*')
    .eq('po_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch line items', details: error.message }, { status: 500 });

  return NextResponse.json({ line_items: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { description, quantity, unit_price } = body as {
    description?: string;
    quantity?: number;
    unit_price?: number;
  };

  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const supabase = await createClient();

  // Verify PO belongs to org
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });

  const qty = quantity ?? 1;
  const price = unit_price ?? 0;
  const amount = qty * price;

  const { data: lineItem, error } = await supabase
    .from('purchase_order_line_items')
    .insert({
      po_id: id,
      description,
      quantity: qty,
      unit_price: price,
      amount,
    })
    .select()
    .single();

  if (error || !lineItem) return NextResponse.json({ error: 'Failed to create line item', details: error?.message }, { status: 500 });

  // Recalculate PO total
  const { data: lines } = await supabase
    .from('purchase_order_line_items')
    .select('amount')
    .eq('po_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { amount: number }) => sum + (l.amount ?? 0), 0);
  await supabase.from('purchase_orders').update({ total_amount: newTotal }).eq('id', id);

  return NextResponse.json({ success: true, line_item: lineItem }, { status: 201 });
}
