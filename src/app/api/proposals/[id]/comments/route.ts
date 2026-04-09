import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { notifyCommentPosted } from '@/lib/notifications/triggers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from('proposal_comments')
    .select('*, author:users!author_id(full_name, avatar_url)')
    .eq('proposal_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: comments ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, organization_id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const body = await request.json();
  const commentBody = (body.body ?? '').trim();

  if (!commentBody) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from('proposal_comments')
    .insert({
      proposal_id: id,
      author_id: perm.userId,
      body: commentBody,
      phase_id: body.phase_id || null,
      deliverable_id: body.deliverable_id || null,
      is_internal: body.is_internal ?? false,
    })
    .select('*, author:users!author_id(full_name, avatar_url)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify org admin of new comment
  if (comment) {
    notifyCommentPosted(comment.id as string, id, perm.organizationId).catch(() => {});
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}
