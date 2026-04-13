import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/[id]/comments — List comments (internal filtered by role)
 * POST /api/advances/[id]/comments — Add comment
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  // RLS handles internal comment filtering
  const { data, error } = await ctx.supabase
    .from('advance_comments')
    .select('*, users(full_name, avatar_url)')
    .eq('organization_id', ctx.organizationId)
    .eq('advance_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  if (!body.comment_text || body.comment_text.trim().length === 0) {
    return NextResponse.json({ error: 'comment_text is required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_comments')
    .insert({
      advance_id: id,
      line_item_id: body.line_item_id ?? null,
      user_id: ctx.userId,
      comment_text: body.comment_text.trim(),
      is_internal: body.is_internal ?? false,
      is_contributor_visible: body.is_contributor_visible ?? true,
      mentioned_user_ids: body.mentioned_user_ids ?? [],
      parent_comment_id: body.parent_comment_id ?? null,
    })
    .eq('organization_id', ctx.organizationId)
    .select('*, users(full_name, avatar_url)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to add comment', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
