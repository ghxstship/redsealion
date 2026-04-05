import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/harbor-master/audit';

export async function GET() {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data: sessions, error } = await ctx.supabase
    .from('sessions')
    .select('id, ip_address, user_agent, auth_method, mfa_verified, is_active, last_active_at, expires_at, created_at')
    .eq('user_id', ctx.userId)
    .eq('is_active', true)
    .order('last_active_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }

  return NextResponse.json({ sessions: sessions ?? [] });
}

export async function DELETE(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('id');
  const all = url.searchParams.get('all');

  if (all === 'true') {
    const { error } = await ctx.supabase
      .from('sessions')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: ctx.userId,
        revoke_reason: 'manual',
      })
      .eq('user_id', ctx.userId)
      .eq('is_active', true);

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke sessions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All sessions revoked' });
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'Session id or all=true required' }, { status: 400 });
  }

  const { error } = await ctx.supabase
    .from('sessions')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: ctx.userId,
      revoke_reason: 'manual',
    })
    .eq('id', sessionId);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }

  writeAuditLog({
    organizationId: null,
    actorId: ctx.userId,
    actorType: 'user',
    action: 'session.revoked',
    resourceType: 'session',
    resourceId: sessionId,
    metadata: { reason: 'manual' },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
