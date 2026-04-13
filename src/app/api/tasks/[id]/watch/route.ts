import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

/**
 * Task watch API — subscribe/unsubscribe from task updates.
 *
 * GET    — check if current user is watching
 * POST   — start watching
 * DELETE — stop watching
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ watching: false });
  if (!perm.allowed) return NextResponse.json({ watching: false });

  const { id: taskId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ watching: false });

  // Verify parent task belongs to user's organization
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', perm.organizationId)
    .single();
  if (!task) return NextResponse.json({ watching: false });

  const { data } = await supabase
    .from('task_watchers')
    .select('id')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .limit(1);

  return NextResponse.json({ watching: (data?.length ?? 0) > 0 });
}

export async function POST(
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify parent task belongs to user's organization
  const { data: taskCheck } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', perm.organizationId)
    .single();
  if (!taskCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase.from('task_watchers').upsert(
    { task_id: taskId, user_id: user.id },
    { onConflict: 'task_id,user_id' },
  );

  return NextResponse.json({ watching: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: taskId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify parent task belongs to user's organization
  const { data: taskCheck } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .eq('organization_id', perm.organizationId)
    .single();
  if (!taskCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase
    .from('task_watchers')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', user.id);

  return NextResponse.json({ watching: false });
}
