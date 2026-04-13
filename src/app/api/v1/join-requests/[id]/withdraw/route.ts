import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/v1/join-requests/:id/withdraw — Withdraw own pending request
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: joinRequest } = await ctx.supabase
    .from('join_requests')
    .select('id, user_id, status')
    .eq('organization_id', ctx.organizationId)
    .eq('id', id)
    .single();

  if (!joinRequest) {
    return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
  }

  if (joinRequest.user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Can only withdraw your own request' }, { status: 403 });
  }

  if (joinRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be withdrawn' }, { status: 400 });
  }

  await ctx.supabase.from('join_requests')
    .update({ status: 'withdrawn' })
    .eq('organization_id', ctx.organizationId)
    .eq('id', id);

  return NextResponse.json({ success: true, status: 'withdrawn' });
}
