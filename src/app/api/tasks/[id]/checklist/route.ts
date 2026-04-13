import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * Task checklist items API — lightweight sub-items within a task.
 *
 * GET  /api/tasks/[id]/checklist — list items
 * POST /api/tasks/[id]/checklist — add item
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

  // Verify parent task belongs to user's organization
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', perm.organizationId)
    .single();
  if (!task) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from('task_checklist_items')
    .select('id, text, done, sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true });

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ items: [] });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await params;
  const body = await request.json().catch(() => ({}));
  const { text } = body as { text?: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
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

  // Get next sort order
  const { data: existing } = await supabase
    .from('task_checklist_items')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = ((existing?.[0]?.sort_order as number) ?? -1) + 1;

  const { data: item, error } = await supabase
    .from('task_checklist_items')
    .insert({
      task_id: taskId,
      text: text.trim(),
      done: false,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}
