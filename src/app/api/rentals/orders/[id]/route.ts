import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('rental_orders')
    .select('*, rental_line_items(*), sub_rentals(*), clients(id, name), events(id, name)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !order) return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['status', 'rental_start', 'rental_end', 'total_cents', 'deposit_cents', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: order, error } = await supabase
    .from('rental_orders')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !order) return NextResponse.json({ error: 'Failed to update rental order', details: error?.message }, { status: 500 });

  if ('status' in updates) {
    dispatchWebhookEvent(perm.organizationId, 'rental_order.status_changed', { rental_order_id: id, status: updates.status }).catch(() => {});
  }

  logAuditAction({ orgId: perm.organizationId, action: 'rental_order.update', entity: 'rental_orders', entityId: id, metadata: updates }).catch(() => {});

  return NextResponse.json({ success: true, order });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('rental_orders')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete rental order', details: error.message }, { status: 500 });

  logAuditAction({ orgId: perm.organizationId, action: 'rental_order.delete', entity: 'rental_orders', entityId: id }).catch(() => {});

  return NextResponse.json({ success: true });
}
