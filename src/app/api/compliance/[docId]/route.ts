import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:compliance:item');

interface RouteContext { params: Promise<{ docId: string }> }

/**
 * GET /api/compliance/[docId] — Single document detail
 */
export async function GET(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_documents')
    .select('*, crew_profiles(id, user_id, users:user_id(full_name, email))')
    .eq('id', docId)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // GAP-M9: Read-access audit logging
  await logAudit({ action: 'compliance.detail_viewed', entityType: 'compliance_document', entityId: docId }, supabase).catch(() => {});

  return NextResponse.json(data);
}

/**
 * PATCH /api/compliance/[docId] — Update a compliance document
 */
export async function PATCH(request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId } = await context.params;
  const body = await request.json();
  const { status, expiry_date, notes, description, rejection_reason, issued_to } = body;

  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (expiry_date !== undefined) update.expiry_date = expiry_date;
  if (notes !== undefined) update.notes = notes;
  if (description !== undefined) update.description = description;
  if (rejection_reason !== undefined) update.rejection_reason = rejection_reason;
  if (issued_to !== undefined) update.issued_to = issued_to;

  if (status === 'verified') {
    const { data: { user } } = await supabase.auth.getUser();
    update.verified_by = user?.id;
    update.verified_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('compliance_documents')
    .update(update)
    .eq('id', docId)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) {
    log.error('Failed to update compliance document', { docId }, error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  await logAudit({ action: 'compliance.updated', entityType: 'compliance_document', entityId: docId, metadata: update }, supabase);

  return NextResponse.json(data);
}

/**
 * DELETE /api/compliance/[docId] — Delete a compliance document
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const perm = await checkPermission('crew', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId } = await context.params;
  const supabase = await createClient();

  // GAP-L1: Soft-delete instead of hard-delete
  const { error } = await supabase
    .from('compliance_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', docId)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null);

  if (error) {
    log.error('Failed to delete compliance document', { docId }, error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  await logAudit({ action: 'compliance.deleted', entityType: 'compliance_document', entityId: docId }, supabase);

  return NextResponse.json({ success: true });
}
