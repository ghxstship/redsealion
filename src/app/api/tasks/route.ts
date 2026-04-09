import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { checkAutomationTriggers } from '@/lib/automations/trigger';

export async function GET(request: NextRequest) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('tasks')
    .select('*, assignee:users!tasks_assignee_id_fkey(id, full_name, avatar_url)')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const assigneeId = searchParams.get('assignee_id');
  if (assigneeId) {
    query = query.eq('assignee_id', assigneeId);
  }

  const proposalId = searchParams.get('proposal_id');
  if (proposalId) {
    query = query.eq('proposal_id', proposalId);
  }

  const parentTaskId = searchParams.get('parent_task_id');
  if (parentTaskId === 'null') {
    query = query.is('parent_task_id', null);
  } else if (parentTaskId) {
    query = query.eq('parent_task_id', parentTaskId);
  }

  const dueDateFrom = searchParams.get('due_date_from');
  if (dueDateFrom) {
    query = query.gte('due_date', dueDateFrom);
  }

  const dueDateTo = searchParams.get('due_date_to');
  if (dueDateTo) {
    query = query.lte('due_date', dueDateTo);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    title,
    description,
    status,
    priority,
    assignee_id,
    proposal_id,
    phase_id,
    parent_task_id,
    due_date,
    start_date,
    estimated_hours,
    recurrence_rule,
  } = body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    proposal_id?: string;
    phase_id?: string;
    parent_task_id?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    recurrence_rule?: Record<string, unknown>;
  };

  if (!title) {
    return NextResponse.json({ error: 'title is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({
      organization_id: orgId,
      title,
      description: description || null,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee_id: assignee_id || null,
      proposal_id: proposal_id || null,
      phase_id: phase_id || null,
      parent_task_id: parent_task_id || null,
      due_date: due_date || null,
      start_date: start_date || null,
      estimated_hours: estimated_hours ?? null,
      recurrence_rule: recurrence_rule ?? null,
      recurring_parent_id: null,
      created_by: perm.userId,
      sort_order: 0,
    })
    .select()
    .single();

  if (insertError || !task) {
    return NextResponse.json(
      { error: 'Failed to create task.', details: insertError?.message },
      { status: 500 },
    );
  }

  // Fire automation triggers asynchronously
  checkAutomationTriggers('task_created', {
    org_id: orgId,
    task_id: task.id,
    title: task.title,
    status: task.status,
    assignee_id: task.assignee_id,
  }).catch(() => {});

  return NextResponse.json({ success: true, task });
}
