import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH /api/v1/invite-codes/:id — Deactivate or extend expiry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { is_active, expires_at } = body as { is_active?: boolean; expires_at?: string };

  const { data: code } = await ctx.supabase.from('invite_codes').select().eq('id', id).single();
  if (!code) return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });

  const isCreator = code.created_by === ctx.userId;
  let isAdmin = false;
  if (!isCreator) {
    const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
      p_user_id: ctx.userId,
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

  const { data: updated, error } = await ctx.supabase
    .from('invite_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

  if (is_active === false) {
    ctx.supabase.from('audit_log').insert({
      organization_id: code.organization_id,
      user_id: ctx.userId,
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
