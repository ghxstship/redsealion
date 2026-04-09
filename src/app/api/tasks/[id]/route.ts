import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { createClient } from '@/lib/supabase/server';
import { checkAutomationTriggers } from '@/lib/automations/trigger';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, task_checklist_items(*), task_watchers(*), task_attachments(*), task_comments(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ task });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    title,
    description,
    status,
    priority,
    assignee_id,
    proposal_id,
    phase_id,
    due_date,
    start_date,
    estimated_hours,
    actual_hours,
    sort_order,
  } = body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string | null;
    proposal_id?: string | null;
    phase_id?: string | null;
    due_date?: string | null;
    start_date?: string | null;
    estimated_hours?: number | null;
    actual_hours?: number | null;
    sort_order?: number;
  };

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch current task to detect status changes
  const { data: existingTask, error: fetchError } = await supabase
    .from('tasks')
    .select()
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !existingTask) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  // Build update payload with only provided fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assignee_id !== undefined) updates.assignee_id = assignee_id;
  if (proposal_id !== undefined) updates.proposal_id = proposal_id;
  if (phase_id !== undefined) updates.phase_id = phase_id;
  if (due_date !== undefined) updates.due_date = due_date;
  if (start_date !== undefined) updates.start_date = start_date;
  if (estimated_hours !== undefined) updates.estimated_hours = estimated_hours;
  if (actual_hours !== undefined) updates.actual_hours = actual_hours;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No fields to update.' },
      { status: 400 },
    );
  }

  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (updateError || !task) {
    return NextResponse.json(
      { error: 'Failed to update task.', details: updateError?.message },
      { status: 500 },
    );
  }

  // Fire automation triggers when status changes
  if (status && status !== existingTask.status) {
    checkAutomationTriggers('task_status_change', {
      org_id: orgId,
      task_id: id,
      title: task.title,
      old_status: existingTask.status,
      new_status: status,
      assignee_id: task.assignee_id,
    }).catch(() => { /* best-effort, failure is non-critical */ });
  }

  return NextResponse.json({ success: true, task });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'delete');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete task.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
