import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * GET /api/work-orders/[id]/assignments — list crew assignments for a work order.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('work_order_assignments')
    .select('*, crew_profiles(id, full_name, phone)')
    .eq('work_order_id', id)
    .order('assigned_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch assignments', details: error.message }, { status: 500 });

  return NextResponse.json({ assignments: data ?? [] });
}

/**
 * POST /api/work-orders/[id]/assignments — assign crew to a work order.
 * Body: { crew_profile_id: string, role?: string }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { crew_profile_id, role } = body;

  if (!crew_profile_id) return NextResponse.json({ error: 'crew_profile_id is required.' }, { status: 400 });

  const supabase = await createClient();

  // Verify work order belongs to this org
  const { data: wo } = await supabase
    .from('work_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

  const { data: assignment, error } = await supabase
    .from('work_order_assignments')
    .insert({
      work_order_id: id,
      crew_profile_id,
      role: role || null,
    })
    .select('*, crew_profiles(id, full_name)')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Crew member already assigned.' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to assign crew', details: error.message }, { status: 500 });
  }

  logAuditAction({
    orgId: perm.organizationId,
    action: 'work_order.crew_assigned',
    entity: 'work_order',
    entityId: id,
    metadata: { crew_profile_id, role },
  }).catch(() => {});

  return NextResponse.json({ success: true, assignment });
}

/**
 * DELETE /api/work-orders/[id]/assignments — remove a crew assignment.
 * Query param: ?assignment_id=uuid
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const url = new URL(request.url);
  const assignmentId = url.searchParams.get('assignment_id');

  if (!assignmentId) return NextResponse.json({ error: 'assignment_id query param is required.' }, { status: 400 });

  const supabase = await createClient();

  // Verify work order belongs to this org
  const { data: wo } = await supabase
    .from('work_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

  const { error } = await supabase
    .from('work_order_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('work_order_id', id);

  if (error) return NextResponse.json({ error: 'Failed to remove assignment', details: error.message }, { status: 500 });

  logAuditAction({
    orgId: perm.organizationId,
    action: 'work_order.crew_removed',
    entity: 'work_order',
    entityId: id,
    metadata: { assignment_id: assignmentId },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
