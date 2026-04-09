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

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
  return NextResponse.json({ purchase_order: po });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'po_number', 'vendor_name', 'description', 'total_amount',
    'status', 'issued_date', 'due_date',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !po) return NextResponse.json({ error: 'Failed to update PO', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, purchase_order: po });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('purchase_orders', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase.from('purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete PO', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
