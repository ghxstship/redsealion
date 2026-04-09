import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const purchaseOrderId = url.searchParams.get('purchase_order_id');

  let query = supabase
    .from('goods_receipts')
    .select('*, purchase_orders(id, po_number, vendor_id, vendors(name)), users!received_by(full_name)')
    .eq('organization_id', perm.organizationId)
    .order('received_date', { ascending: false });

  if (purchaseOrderId) query = query.eq('purchase_order_id', purchaseOrderId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch receipts', details: error.message }, { status: 500 });

  return NextResponse.json({ receipts: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { purchase_order_id, received_date, notes, items } = body as Record<string, unknown>;

  if (!purchase_order_id) return NextResponse.json({ error: 'purchase_order_id is required' }, { status: 400 });

  const supabase = await createClient();

  // Generate receipt number
  const { count } = await supabase
    .from('goods_receipts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const receiptNumber = `GR-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data: receipt, error } = await supabase
    .from('goods_receipts')
    .insert({
      organization_id: perm.organizationId,
      purchase_order_id: purchase_order_id as string,
      receipt_number: receiptNumber,
      received_by: perm.userId,
      received_date: (received_date as string) ?? new Date().toISOString(),
      notes: (notes as string) ?? null,
      items: (items as unknown[]) ?? [],
    })
    .select()
    .single();

  if (error || !receipt) return NextResponse.json({ error: 'Failed to create receipt', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, receipt }, { status: 201 });
}
