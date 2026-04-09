import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:crew:compliance:item');

interface RouteContext { params: Promise<{ id: string; docId: string }> }

/**
 * PATCH /api/crew/[id]/compliance/[docId]
 * Update compliance document status.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, docId } = await context.params;
  const body = await request.json();
  const { status, expiry_date, notes } = body;

  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (expiry_date !== undefined) update.expiry_date = expiry_date;
  if (notes !== undefined) update.notes = notes;

  if (status === 'verified') {
    const { data: { user } } = await supabase.auth.getUser();
    update.verified_by = user?.id;
    update.verified_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('compliance_documents')
    .update(update)
    .eq('id', docId)
    .eq('crew_profile_id', id)
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to update compliance document', { docId }, error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  await logAudit({ action: 'crew.compliance.updated', entityType: 'compliance_document', entityId: docId, metadata: update }, supabase);

  return NextResponse.json(data);
}

/**
 * DELETE /api/crew/[id]/compliance/[docId]
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, docId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('compliance_documents')
    .delete()
    .eq('id', docId)
    .eq('crew_profile_id', id);

  if (error) {
    log.error('Failed to delete compliance document', { docId }, error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  await logAudit({ action: 'crew.compliance.deleted', entityType: 'compliance_document', entityId: docId }, supabase);

  return NextResponse.json({ success: true });
}
