import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/v1/sessions/:id — Revoke a specific session
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: session } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'Session not found or already revoked' }, { status: 404 });
  }

  // Can revoke own session, or admin can revoke others
  const isOwn = session.user_id === user.id;
  if (!isOwn) {
    // Need manage:session permission for the org
    const { data: targetMem } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', session.user_id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (targetMem) {
      const { data: hasPerm } = await supabase.rpc('check_permission', {
        p_user_id: user.id,
        p_action: 'manage',
        p_resource: 'session',
        p_scope: 'organization',
        p_scope_id: targetMem.organization_id,
      });

      if (!hasPerm) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
  }

  await supabase.from('sessions').update({
    is_active: false,
    revoked_at: new Date().toISOString(),
    revoked_by: user.id,
    revoke_reason: isOwn ? 'manual' : 'security',
  }).eq('id', id);

  supabase.from('audit_log').insert({
    organization_id: null,
    user_id: user.id,
    actor_type: 'user',
    action: 'session.revoked',
    entity_type: 'session',
    resource_type: 'session',
    entity_id: id,
    changes: {},
    metadata: { target_user_id: session.user_id, reason: isOwn ? 'manual' : 'security' },
  }).then(() => {});

  return NextResponse.json({ success: true });
}
