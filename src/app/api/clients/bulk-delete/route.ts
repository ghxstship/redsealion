import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function POST(request: NextRequest) {
  const perm = await checkPermission('clients', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { ids } = body as { ids?: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: now })
    .in('id', ids)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete clients', details: error.message }, { status: 500 });
  }

  // Cascade soft-delete to contacts
  await supabase
    .from('client_contacts')
    .update({ deleted_at: now })
    .in('client_id', ids);

  logAuditAction({
    orgId: perm.organizationId,
    action: 'client.bulk_deleted',
    entity: 'clients',
    metadata: { client_ids: ids, count: ids.length },
  }).catch(() => {});

  return NextResponse.json({ success: true, deleted: ids.length });
}
