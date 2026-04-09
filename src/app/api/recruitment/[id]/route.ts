import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:recruitment:item');

interface RouteContext { params: Promise<{ id: string }> }

/**
 * PATCH /api/recruitment/[id] — update a recruitment position
 */
export async function PATCH(request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json();

  const allowedFields = ['title', 'department', 'description', 'status'];
  const update: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recruitment_positions')
    .update(update)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to update position', { id }, error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  await logAudit({ action: 'recruitment.position.updated', entityType: 'recruitment_position', entityId: id, metadata: update }, supabase);

  return NextResponse.json(data);
}

/**
 * DELETE /api/recruitment/[id] — delete a recruitment position
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('recruitment_positions')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    log.error('Failed to delete position', { id }, error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  await logAudit({ action: 'recruitment.position.deleted', entityType: 'recruitment_position', entityId: id }, supabase);

  return NextResponse.json({ success: true });
}
