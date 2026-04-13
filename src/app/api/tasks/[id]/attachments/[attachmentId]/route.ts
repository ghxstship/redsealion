import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * DELETE /api/tasks/[id]/attachments/[attachmentId] — remove attachment
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId, attachmentId } = await params;
  const supabase = await createClient();

  // Verify parent task belongs to user's organization
  const { data: taskCheck } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', perm.organizationId)
    .single();
  if (!taskCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('task_id', taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
