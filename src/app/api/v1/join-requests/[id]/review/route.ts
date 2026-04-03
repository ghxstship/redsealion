import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/join-requests/:id/review — Approve or deny a join request
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { decision, role_id, seat_type = 'internal', deny_reason } = body as {
    decision?: 'approve' | 'deny';
    role_id?: string;
    seat_type?: string;
    deny_reason?: string;
  };

  if (!decision || !['approve', 'deny'].includes(decision)) {
    return NextResponse.json({ error: 'decision must be "approve" or "deny"' }, { status: 400 });
  }

  const { data: joinRequest } = await supabase
    .from('join_requests')
    .select('*')
    .eq('id', id)
    .eq('status', 'pending')
    .single();

  if (!joinRequest) {
    return NextResponse.json({ error: 'Join request not found or not pending' }, { status: 404 });
  }

  // Permission check
  const { data: hasPerm } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: 'approve',
    p_resource: 'member',
    p_scope: joinRequest.scope_type,
    p_scope_id: joinRequest.scope_id,
  });

  if (!hasPerm) {
    return NextResponse.json({ error: 'Insufficient permissions to review requests' }, { status: 403 });
  }

  const now = new Date().toISOString();

  if (decision === 'deny') {
    await supabase.from('join_requests').update({
      status: 'denied',
      reviewed_by: user.id,
      reviewed_at: now,
      deny_reason: deny_reason ?? null,
    }).eq('id', id);

    supabase.from('audit_log').insert({
      organization_id: joinRequest.organization_id,
      user_id: user.id,
      actor_type: 'user',
      action: 'join_request.denied',
      entity_type: 'join_request',
      resource_type: 'join_request',
      entity_id: id,
      changes: {},
      metadata: { deny_reason, requester_id: joinRequest.user_id },
    }).then(() => {});

    return NextResponse.json({ success: true, status: 'denied' });
  }

  // Approve: create membership
  const orgId = joinRequest.organization_id as string;
  const scopeType = joinRequest.scope_type as string;
  const scopeId = joinRequest.scope_id as string;

  // Determine role: use provided role_id or org default
  let assignedRoleId = role_id;
  if (!assignedRoleId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('default_member_role_id')
      .eq('id', orgId)
      .single();
    assignedRoleId = (org?.default_member_role_id as string) ?? null;
  }

  if (!assignedRoleId) {
    return NextResponse.json({ error: 'role_id is required for approval' }, { status: 400 });
  }

  if (scopeType === 'organization') {
    await supabase.from('organization_memberships').insert({
      user_id: joinRequest.user_id,
      organization_id: scopeId,
      role_id: assignedRoleId,
      seat_type,
      status: 'active',
      joined_via: 'join_request',
      approved_by: user.id,
    });
  } else if (scopeType === 'team') {
    await supabase.from('team_memberships').insert({
      user_id: joinRequest.user_id,
      team_id: scopeId,
      organization_id: orgId,
      role_id: assignedRoleId,
      status: 'active',
      joined_via: 'join_request',
      invited_by: user.id,
    });
  } else if (scopeType === 'project') {
    await supabase.from('project_memberships').insert({
      user_id: joinRequest.user_id,
      project_id: scopeId,
      organization_id: orgId,
      role_id: assignedRoleId,
      seat_type,
      status: 'active',
      joined_via: 'join_request',
      approved_by: user.id,
    });
  }

  await supabase.from('join_requests').update({
    status: 'approved',
    reviewed_by: user.id,
    reviewed_at: now,
  }).eq('id', id);

  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user.id,
    actor_type: 'user',
    action: 'join_request.approved',
    entity_type: 'join_request',
    resource_type: 'join_request',
    entity_id: id,
    changes: {},
    metadata: { requester_id: joinRequest.user_id, role_id: assignedRoleId },
  }).then(() => {});

  return NextResponse.json({ success: true, status: 'approved' });
}
