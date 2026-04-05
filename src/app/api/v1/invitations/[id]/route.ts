import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/v1/invitations/:id/accept — Accept invitation
 * POST /api/v1/invitations/:id/decline — Decline invitation
 * POST /api/v1/invitations/:id/revoke — Revoke invitation
 *
 * Action determined by `action` field in request body.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: 'accept' | 'decline' | 'revoke' };

  if (!action || !['accept', 'decline', 'revoke'].includes(action)) {
    return NextResponse.json({ error: 'action must be "accept", "decline", or "revoke"' }, { status: 400 });
  }

  // Fetch the invitation
  const { data: invitation, error: fetchErr } = await ctx.supabase
    .from('invitations')
    .select()
    .eq('id', id)
    .single();

  if (fetchErr || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: `Invitation is ${invitation.status}, not pending` }, { status: 400 });
  }

  // Check expiry
  if (new Date(invitation.expires_at as string) < new Date()) {
    await ctx.supabase.from('invitations').update({ status: 'expired' }).eq('id', id);
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
  }

  const { data: userData } = await ctx.supabase.from('users').select('email').eq('id', ctx.userId).single();

  if (action === 'accept') {
    // Email match check (STRICT)
    if (userData?.email !== invitation.invited_email) {
      return NextResponse.json({ error: 'This invitation was sent to a different email address' }, { status: 403 });
    }

    // Create membership based on scope_type
    const scopeType = invitation.scope_type as string;
    const scopeId = invitation.scope_id as string;
    const orgId = invitation.organization_id as string;

    if (scopeType === 'organization') {
      const { error: memErr } = await ctx.supabase.from('organization_memberships').insert({
        user_id: ctx.userId,
        organization_id: scopeId,
        role_id: invitation.role_id,
        seat_type: invitation.seat_type,
        status: 'active',
        joined_via: 'direct_invite',
        invited_by: invitation.invited_by,
      });

      if (memErr) {
        return NextResponse.json({ error: 'Failed to create membership', details: memErr.message }, { status: 500 });
      }

      // Increment seat count
      const seatKey = invitation.seat_type === 'internal' ? 'internal_seats_used' : 'external_seats_used';
      await ctx.supabase.rpc('increment_counter', { table_name: 'seat_allocations', column_name: seatKey, row_id: orgId });
    } else if (scopeType === 'team') {
      await ctx.supabase.from('team_memberships').insert({
        user_id: ctx.userId,
        team_id: scopeId,
        organization_id: orgId,
        role_id: invitation.role_id,
        status: 'active',
        joined_via: 'direct_invite',
        invited_by: invitation.invited_by,
      });
    } else if (scopeType === 'project') {
      await ctx.supabase.from('project_memberships').insert({
        user_id: ctx.userId,
        project_id: scopeId,
        organization_id: orgId,
        role_id: invitation.role_id,
        seat_type: invitation.seat_type,
        status: 'active',
        joined_via: 'direct_invite',
        invited_by: invitation.invited_by,
      });
    }

    // Mark invitation accepted
    await ctx.supabase.from('invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', id);

    // Audit log
    ctx.supabase.from('audit_log').insert({
      organization_id: orgId,
      user_id: ctx.userId,
      actor_type: 'user',
      action: 'invitation.accepted',
      entity_type: 'invitation',
      resource_type: 'invitation',
      entity_id: id,
      changes: {},
      metadata: { scope_type: scopeType, scope_id: scopeId },
    }).then(() => {});

    return NextResponse.json({ success: true, action: 'accepted' });
  }

  if (action === 'decline') {
    if (userData?.email !== invitation.invited_email) {
      return NextResponse.json({ error: 'Only the invitee can decline' }, { status: 403 });
    }

    await ctx.supabase.from('invitations').update({
      status: 'declined',
      declined_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, action: 'declined' });
  }

  if (action === 'revoke') {
    // Only inviter or admin can revoke
    const isInviter = ctx.userId === invitation.invited_by;
    let isApprover = false;

    if (!isInviter) {
      const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
        p_user_id: ctx.userId,
        p_action: 'approve',
        p_resource: 'member',
        p_scope: 'organization',
        p_scope_id: invitation.organization_id,
      });
      isApprover = hasPerm === true;
    }

    if (!isInviter && !isApprover) {
      return NextResponse.json({ error: 'Insufficient permissions to revoke' }, { status: 403 });
    }

    await ctx.supabase.from('invitations').update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: ctx.userId,
    }).eq('id', id);

    return NextResponse.json({ success: true, action: 'revoked' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
