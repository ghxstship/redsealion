import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('fabrication_orders')
    .select('*, bill_of_materials(*), shop_floor_logs(*, users(full_name)), events(id, name), proposals(id, name)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'status', 'priority', 'quantity', 'unit_cost_cents', 'total_cost_cents', 'start_date', 'due_date', 'completed_date', 'assigned_to', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: order, error } = await supabase
    .from('fabrication_orders')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !order) return NextResponse.json({ error: 'Failed to update order', details: error?.message }, { status: 500 });

  if ('status' in updates) {
    dispatchWebhookEvent(perm.organizationId, 'fabrication_order.status_changed' as any, { fabrication_order_id: id, status: updates.status }).catch(() => {});
  }

  return NextResponse.json({ success: true, order });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('fabrication_orders')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete order', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
