import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { logAuditAction } from '@/lib/api/audit-logger';
import { notifyWorkOrderDispatched } from '@/lib/notifications/triggers';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: wo, error } = await supabase
    .from('work_orders')
    .select('*, work_order_assignments(*, crew_profiles(id, full_name, phone)), job_site_photos(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

  return NextResponse.json({ work_order: wo });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'title', 'description', 'status', 'priority', 'location_name', 'location_address',
    'scheduled_start', 'scheduled_end', 'actual_start', 'actual_end',
    'completion_notes', 'checklist', 'is_public_board', 'budget_range', 'bidding_deadline'
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  // Auto-set dispatch/completion timestamps
  if (updates.status === 'dispatched') {
    updates.dispatched_at = new Date().toISOString();
    updates.dispatched_by = perm.userId;
  }
  if (updates.status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.completed_by = perm.userId;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: wo, error } = await supabase
    .from('work_orders')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !wo) return NextResponse.json({ error: 'Failed to update work order', details: error?.message }, { status: 500 });

  if ('status' in updates) {
    // Write to status log
    const previousStatus = wo.status !== updates.status ? (wo as Record<string, unknown>).status : null;
    await supabase.from('work_order_status_log').insert({
      work_order_id: id,
      from_status: previousStatus as string | null,
      to_status: updates.status as string,
      changed_by: perm.userId,
    });

    const eventType = updates.status === 'dispatched' ? 'work_order.dispatched' :
                      updates.status === 'completed' ? 'work_order.completed' :
                      'work_order.status_changed';
    dispatchWebhookEvent(perm.organizationId, eventType as any, { work_order_id: id, status: updates.status }).catch(() => {});

    // Notify crew when dispatched
    if (updates.status === 'dispatched') {
      notifyWorkOrderDispatched(id, perm.organizationId).catch(() => {});
    }
  }

  // Audit log
  logAuditAction({
    orgId: perm.organizationId,
    action: 'work_order.updated',
    entity: 'work_order',
    entityId: id,
    metadata: { fields: Object.keys(updates) },
  }).catch(() => {});

  return NextResponse.json({ success: true, work_order: wo });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('work_orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete work order', details: error.message }, { status: 500 });

  // Audit log
  logAuditAction({
    orgId: perm.organizationId,
    action: 'work_order.deleted',
    entity: 'work_order',
    entityId: id,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
