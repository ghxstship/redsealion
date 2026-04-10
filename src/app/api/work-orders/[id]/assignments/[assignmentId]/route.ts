import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string; assignmentId: string }> }

/**
 * PATCH /api/work-orders/[id]/assignments/[assignmentId]
 * Allows crew to accept/decline an assignment and updates responded_at.
 * Body: { status: 'accepted' | 'declined', notes?: string }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('work_orders', 'view'); // crew just needs view access to respond
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, assignmentId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { status, notes } = body;

  const validStatuses = ['accepted', 'declined'];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify work order belongs to the user's org
  const { data: wo } = await supabase
    .from('work_orders')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (!wo) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

  const updates: Record<string, unknown> = {
    status,
    responded_at: new Date().toISOString(),
  };
  if (notes !== undefined) updates.notes = notes;

  const { data: assignment, error } = await supabase
    .from('work_order_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .eq('work_order_id', id)
    .select('*, crew_profiles(id, full_name)')
    .single();

  if (error || !assignment) {
    return NextResponse.json({ error: 'Assignment not found or update failed', details: error?.message }, { status: 404 });
  }

  logAuditAction({
    orgId: perm.organizationId,
    action: `work_order.crew_${status}`,
    entity: 'work_order',
    entityId: id,
    metadata: { assignment_id: assignmentId, status },
  }).catch(() => {});

  return NextResponse.json({ success: true, assignment });
}
