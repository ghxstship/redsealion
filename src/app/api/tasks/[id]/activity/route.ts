import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * Task activity feed API — surfaces audit_log entries for a specific task.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_log')
    .select('id, action, details, created_at, user_id, users!audit_log_user_id_fkey(full_name)')
    .eq('entity_type', 'task')
    .eq('entity_id', taskId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // Table may not have entries for this entity — return empty
    return NextResponse.json({ entries: [] });
  }

  const entries = (data ?? []).map((row) => {
    const user = row.users as unknown as { full_name: string | null } | null;
    return {
      id: row.id,
      action: row.action,
      details: typeof row.details === 'string' ? row.details : null,
      user_name: user?.full_name ?? null,
      created_at: row.created_at,
    };
  });

  return NextResponse.json({ entries });
}
