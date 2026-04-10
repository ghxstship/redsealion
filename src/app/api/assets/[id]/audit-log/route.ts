import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/assets/[id]/audit-log
 * Returns the audit trail for a specific asset.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from('asset_audit_log')
    .select('id, field_changed, old_value, new_value, changed_by, change_source, created_at')
    .eq('asset_id', id)
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit log.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: entries ?? [] });
}
