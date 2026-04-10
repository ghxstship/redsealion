import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: members, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, avatar_url, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 },
    );
  }

  return NextResponse.json({ members: members || [] });
}

// NOTE: DELETE is handled by /api/settings/team/[id] via soft-deactivation of
// organization_memberships. No collection-level DELETE is needed.
