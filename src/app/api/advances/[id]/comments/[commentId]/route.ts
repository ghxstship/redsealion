import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH  /api/advances/[id]/comments/[commentId] — Edit comment
 * DELETE /api/advances/[id]/comments/[commentId] — Delete comment
 *
 * Gap: M-07 — Comments could not be edited or deleted after posting
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, commentId } = await params;
  const body = await request.json();

  const content = (body as Record<string, unknown>).content as string;
  if (!content?.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 422 });
  }

  // Only the author can edit their comment
  const { data: existing } = await ctx.supabase
    .from('advance_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('advance_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if ((existing as Record<string, unknown>).user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Can only edit your own comments' }, { status: 403 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_comments')
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update comment', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, commentId } = await params;

  // Author or org admin can delete
  const { data: existing } = await ctx.supabase
    .from('advance_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('advance_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const isAuthor = (existing as Record<string, unknown>).user_id === ctx.userId;

  if (!isAuthor) {
    // Check if org admin
    const { data: advance } = await ctx.supabase
      .from('production_advances')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }
  }

  const { error } = await ctx.supabase
    .from('advance_comments')
    .delete()
    .eq('id', commentId)
    .eq('advance_id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete comment', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
