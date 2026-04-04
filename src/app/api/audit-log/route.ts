import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(_request: NextRequest) {
  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, user_id, action, entity_type, entity_id, ip_address, user_agent, metadata, created_at')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit log.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
