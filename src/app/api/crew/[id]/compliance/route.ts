import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crew/[id]/compliance — List compliance documents for a crew member
 * POST /api/crew/[id]/compliance — Create a new compliance document record
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: crewId } = await context.params;
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from('compliance_documents')
    .select()
    .eq('crew_profile_id', crewId)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch compliance documents.', details: error.message },
      { status: 500 },
    );
  }

  // GAP-M9: Read-access audit logging
  await logAudit({ action: 'crew.compliance.viewed', entityType: 'compliance_document', entityId: crewId, metadata: { count: documents?.length ?? 0 } }, supabase).catch(() => {});

  return NextResponse.json({ documents: documents ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: crewId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const {
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
  } = body as {
    document_type?: string;
    document_name?: string;
    description?: string;
    file_url?: string;
    file_name?: string;
    file_size_bytes?: number;
    issued_date?: string;
    expiry_date?: string;
    issued_to?: string;
    notes?: string;
  };

  if (!document_type || !document_name) {
    return NextResponse.json(
      { error: 'document_type and document_name are required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from('compliance_documents')
    .insert({
      organization_id: perm.organizationId,
      crew_profile_id: crewId,
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
    return NextResponse.json(
      { error: 'Failed to create compliance document.', details: error?.message },
      { status: 500 },
    );
  }

  await logAudit({ action: 'crew.compliance.created', entityType: 'compliance_document', entityId: doc.id, metadata: { document_type, document_name } }, supabase);

  return NextResponse.json({ success: true, document: doc });
}
