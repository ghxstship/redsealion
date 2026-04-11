import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('events', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: schedule, error } = await supabase
    .from('production_schedules')
    .select('*, events(id, name), schedule_blocks(*), schedule_milestones(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  return NextResponse.json({ schedule });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('events', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'schedule_type', 'status', 'start_date', 'end_date', 'timezone', 'event_id'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: schedule, error } = await supabase
    .from('production_schedules')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !schedule) return NextResponse.json({ error: 'Failed to update schedule', details: error?.message }, { status: 500 });

  logAuditAction({ orgId: perm.organizationId, action: 'schedule.updated', entity: 'production_schedules', entityId: id, metadata: { fields: Object.keys(updates) } }).catch(() => {});

  return NextResponse.json({ success: true, schedule });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('events', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Soft-delete: set deleted_at instead of hard-deleting
  const { error } = await supabase
    .from('production_schedules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });

  logAuditAction({ orgId: perm.organizationId, action: 'schedule.deleted', entity: 'production_schedules', entityId: id }).catch(() => {});

  return NextResponse.json({ success: true });
}
