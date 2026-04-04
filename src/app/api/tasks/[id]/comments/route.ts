import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { extractMentionedUserIds } from '@/lib/mentions';
import { notifyMentionedUsers } from '@/lib/mentions-server';

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

  const { data: comments, error } = await supabase
    .from('task_comments')
    .select('*, author:users!task_comments_author_id_fkey(id, full_name, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch comments.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ comments: comments ?? [] });
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
  const { body: commentBody } = body as { body?: string };

  if (!commentBody?.trim()) {
    return NextResponse.json({ error: 'Comment body is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const mentions = extractMentionedUserIds(commentBody);

  const { data: comment, error: insertError } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: perm.userId,
      body: commentBody,
      mentions,
    })
    .select('*, author:users!task_comments_author_id_fkey(id, full_name, avatar_url)')
    .single();

  if (insertError || !comment) {
    return NextResponse.json(
      { error: 'Failed to create comment.', details: insertError?.message },
      { status: 500 },
    );
  }

  // Notify mentioned users asynchronously
  if (mentions.length > 0) {
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', taskId)
      .single();

    const { data: author } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', perm.userId)
      .single();

    notifyMentionedUsers({
      orgId: perm.organizationId,
      entityType: 'task',
      entityId: taskId,
      entityTitle: task?.title ?? 'Untitled Task',
      authorId: perm.userId,
      authorName: author?.full_name ?? 'A team member',
      mentionedUserIds: mentions,
    }).catch(() => {});
  }

  return NextResponse.json({ comment });
}
