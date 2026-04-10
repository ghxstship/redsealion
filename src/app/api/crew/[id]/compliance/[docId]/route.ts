import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:crew:compliance:item');

interface RouteContext { params: Promise<{ id: string; docId: string }> }

/**
 * GET /api/crew/[id]/compliance/[docId]
 * Fetch a single compliance document by ID.
 */
export async function GET(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, docId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_documents')
    .select()
    .eq('id', docId)
    .eq('crew_profile_id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    log.error('Failed to fetch compliance document', { docId }, error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // GAP-M9: Read-access audit logging
  await logAudit({ action: 'crew.compliance.detail_viewed', entityType: 'compliance_document', entityId: docId }, supabase).catch(() => {});

  return NextResponse.json(data);
}

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
  const { status, expiry_date, notes, description, rejection_reason } = body;

  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (expiry_date !== undefined) update.expiry_date = expiry_date;
  if (notes !== undefined) update.notes = notes;
  if (description !== undefined) update.description = description;
  if (rejection_reason !== undefined) update.rejection_reason = rejection_reason;

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

  // GAP-L1: Soft-delete instead of hard-delete
  const { error } = await supabase
    .from('compliance_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', docId)
    .eq('crew_profile_id', id)
    .is('deleted_at', null);

  if (error) {
    log.error('Failed to delete compliance document', { docId }, error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  await logAudit({ action: 'crew.compliance.deleted', entityType: 'compliance_document', entityId: docId }, supabase);

  return NextResponse.json({ success: true });
}
