import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('api:compliance');

/**
 * GET /api/compliance — List all compliance documents for the org
 * Supports optional query params: ?type=coi&status=verified
 */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const docType = searchParams.get('type');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from('compliance_documents')
    .select('*, crew_profiles(id, user_id, users:user_id(full_name, email))', { count: 'exact' })
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (docType) query = query.eq('document_type', docType);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    log.error('Failed to fetch compliance documents', {}, error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }

  // GAP-M9: Read-access audit logging
  try { await logAudit({ action: 'compliance.list_viewed', entityType: 'compliance_document', metadata: { count: count ?? 0, type: docType } }, supabase); } catch { /* non-fatal */ }

  return NextResponse.json({
    documents: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

/**
 * POST /api/compliance — Create a compliance document (org-scoped)
 * Requires crew_profile_id in the body.
 */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));

  const {
    crew_profile_id,
    document_type,
    document_name,
    description,
    file_url,
    file_name,
    file_size_bytes,
    issued_date,
    expiry_date,
    issued_to,
    notes,
  } = body;

  if (!crew_profile_id || !document_type || !document_name) {
    return NextResponse.json(
      { error: 'crew_profile_id, document_type, and document_name are required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('compliance_documents')
    .insert({
      organization_id: perm.organizationId,
      crew_profile_id,
      document_type,
      document_name,
      description: description || null,
      file_url: file_url || null,
      file_name: file_name || null,
      file_size_bytes: file_size_bytes ?? null,
      issued_date: issued_date || null,
      expiry_date: expiry_date || null,
      issued_to: issued_to || null,
      notes: notes || null,
      status: file_url ? 'uploaded' : 'pending',
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !doc) {
    log.error('Failed to create compliance document', {}, error);
    return NextResponse.json(
      { error: 'Failed to create compliance document.', details: error?.message },
      { status: 500 },
    );
  }

  await logAudit(
    { action: 'compliance.created', entityType: 'compliance_document', entityId: doc.id, metadata: { document_type, document_name, crew_profile_id } },
    supabase,
  );

  return NextResponse.json({ success: true, document: doc });
}
