import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/join-requests/:id/withdraw — Withdraw own pending request
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: joinRequest } = await supabase
    .from('join_requests')
    .select('id, user_id, status')
    .eq('id', id)
    .single();

  if (!joinRequest) {
    return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
  }

  if (joinRequest.user_id !== user.id) {
    return NextResponse.json({ error: 'Can only withdraw your own request' }, { status: 403 });
  }

  if (joinRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be withdrawn' }, { status: 400 });
  }

  await supabase.from('join_requests').update({ status: 'withdrawn' }).eq('id', id);

  return NextResponse.json({ success: true, status: 'withdrawn' });
}
