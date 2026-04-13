import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

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
  if (!task) return NextResponse.json({ dependencies: [] });

  const { data, error } = await supabase
    .from('task_dependencies')
    .select('*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(id, title, status)')
    .eq('task_id', taskId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dependencies.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ dependencies: data ?? [] });
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
  const { depends_on_task_id, type, lag_days } = body as {
    depends_on_task_id?: string;
    type?: string;
    lag_days?: number;
  };

  if (!depends_on_task_id) {
    return NextResponse.json({ error: 'depends_on_task_id is required.' }, { status: 400 });
  }

  // Prevent self-dependency
  if (depends_on_task_id === taskId) {
    return NextResponse.json({ error: 'A task cannot depend on itself.' }, { status: 400 });
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
  const { data: reverse } = await supabase
    .from('task_dependencies')
    .select('id')
    .eq('task_id', depends_on_task_id)
    .eq('depends_on_task_id', taskId)
    .limit(1);

  if (reverse && reverse.length > 0) {
    return NextResponse.json({ error: 'Circular dependency detected.' }, { status: 400 });
  }

  const { data: dep, error: insertError } = await supabase
    .from('task_dependencies')
    .insert({
      task_id: taskId,
      depends_on_task_id,
      type: type || 'finish_to_start',
      lag_days: lag_days ?? 0,
    })
    .select()
    .single();

  if (insertError || !dep) {
    return NextResponse.json(
      { error: 'Failed to create dependency.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ dependency: dep });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tierError = await requireFeature('tasks');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: taskId } = await params;
  const { searchParams } = request.nextUrl;
  const depId = searchParams.get('dependency_id');

  if (!depId) {
    return NextResponse.json({ error: 'dependency_id query param is required.' }, { status: 400 });
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
    .from('task_dependencies')
    .delete()
    .eq('id', depId)
    .eq('task_id', taskId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete dependency.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
