import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/v1/sessions/all — Revoke all sessions except current
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentSessionToken = request.headers.get('x-session-token');

  // Revoke all active sessions for the user except the current one
  let query = supabase
    .from('sessions')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      revoke_reason: 'manual',
    })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (currentSessionToken) {
    query = query.neq('session_token_hash', currentSessionToken);
  }

  const { error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
  }

  return NextResponse.json({ success: true, revoked_count: count ?? 0 });
}
