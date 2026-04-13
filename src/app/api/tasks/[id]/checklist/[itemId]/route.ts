import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * Individual checklist item operations.
 *
 * PATCH  /api/tasks/[id]/checklist/[itemId] — toggle done / update text
 * DELETE /api/tasks/[id]/checklist/[itemId] — remove item
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId, itemId } = await params;
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if ('done' in body) updates.done = body.done;
  if ('text' in body) updates.text = body.text;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

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
    .from('task_checklist_items')
    .update(updates)
    .eq('id', itemId)
    .eq('task_id', taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId, itemId } = await params;
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
    .from('task_checklist_items')
    .delete()
    .eq('id', itemId)
    .eq('task_id', taskId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
