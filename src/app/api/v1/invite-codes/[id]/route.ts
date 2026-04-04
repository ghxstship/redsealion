import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/v1/invite-codes/:id — Deactivate or extend expiry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { is_active, expires_at } = body as { is_active?: boolean; expires_at?: string };

  const { data: code } = await supabase.from('invite_codes').select().eq('id', id).single();
  if (!code) return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });

  const isCreator = code.created_by === user.id;
  let isAdmin = false;
  if (!isCreator) {
    const { data: hasPerm } = await supabase.rpc('check_permission', {
      p_user_id: user.id,
      p_action: 'manage',
      p_resource: 'invite_code',
      p_scope: 'organization',
      p_scope_id: code.organization_id,
    });
    isAdmin = hasPerm === true;
  }

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (expires_at !== undefined) updates.expires_at = expires_at;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('invite_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

  if (is_active === false) {
    supabase.from('audit_log').insert({
      organization_id: code.organization_id,
      user_id: user.id,
      actor_type: 'user',
      action: 'invite_code.deactivated',
      entity_type: 'invite_code',
      resource_type: 'invite_code',
      entity_id: id,
      changes: {},
      metadata: {},
    }).then(() => {});
  }

  return NextResponse.json({ success: true, invite_code: updated });
}
