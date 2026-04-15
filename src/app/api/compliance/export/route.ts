import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { buildCsvString } from '@/lib/export-formats';

const log = createLogger('api:compliance:export');

/**
 * GET /api/compliance/export — Export compliance documents as CSV
 * Supports optional query params: ?type=coi&status=verified
 */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('crew', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const docType = searchParams.get('type');
  const status = searchParams.get('status');

  const supabase = await createClient();

  let query = supabase
    .from('compliance_documents')
    .select('document_name, document_type, status, issued_to, issued_date, expiry_date, notes, verified_at, rejection_reason, created_at')
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('document_type', { ascending: true });

  if (docType) query = query.eq('document_type', docType);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    log.error('Failed to export compliance documents', {}, error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }

  const docs = data ?? [];

  const headers = ['Document Name', 'Type', 'Status', 'Issued To', 'Issued Date', 'Expiry Date', 'Notes', 'Verified At', 'Rejection Reason', 'Created At'];
  const rows = docs.map((d) => [
    d.document_name,
    d.document_type,
    d.status,
    d.issued_to ?? '',
    d.issued_date ?? '',
    d.expiry_date ?? '',
    d.notes ?? '',
    d.verified_at ?? '',
    d.rejection_reason ?? '',
    d.created_at,
  ]);

  const csv = buildCsvString(headers, rows);

  try { await logAudit({ action: 'compliance.exported', entityType: 'compliance_document', metadata: { format: 'csv', count: docs.length } }, supabase); } catch { /* non-fatal */ }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="compliance-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
