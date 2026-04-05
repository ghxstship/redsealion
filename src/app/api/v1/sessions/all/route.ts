import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * DELETE /api/v1/sessions/all — Revoke all sessions except current
 */
export async function DELETE(request: Request) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const currentSessionToken = request.headers.get('x-session-token');

  // Revoke all active sessions for the user except the current one
  let query = ctx.supabase
    .from('sessions')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: ctx.userId,
      revoke_reason: 'manual',
    })
    .eq('user_id', ctx.userId)
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
