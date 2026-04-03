import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/v1/memberships/:id — Change role/seat/status
 * DELETE /api/v1/memberships/:id — Remove member
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
  const { role_id, seat_type, status } = body as {
    role_id?: string;
    seat_type?: string;
    status?: string;
  };

  // Fetch the membership
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('*, roles!organization_memberships_role_id_fkey(hierarchy_level)')
    .eq('id', id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  const orgId = membership.organization_id as string;

  // Permission check
  const { data: hasPerm } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: 'manage',
    p_resource: 'member',
    p_scope: 'organization',
    p_scope_id: orgId,
  });

  if (!hasPerm) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Hierarchy ceiling: actor cannot change role of equal or higher rank
  const { data: actorMem } = await supabase
    .from('organization_memberships')
    .select('role_id, roles!organization_memberships_role_id_fkey(hierarchy_level)')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  if (!actorMem) {
    return NextResponse.json({ error: 'Actor membership not found' }, { status: 403 });
  }

  const actorLevel = ((actorMem as Record<string, unknown>).roles as Record<string, number>)?.hierarchy_level ?? 99;
  const targetLevel = ((membership as Record<string, unknown>).roles as Record<string, number>)?.hierarchy_level ?? 99;

  if (targetLevel <= actorLevel && user.id !== membership.user_id) {
    return NextResponse.json({ error: 'Cannot modify a member with equal or higher rank' }, { status: 403 });
  }

  // Validate new role hierarchy if changing role
  if (role_id) {
    const { data: newRole } = await supabase
      .from('roles')
      .select('hierarchy_level')
      .eq('id', role_id)
      .single();

    if (!newRole) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    if ((newRole.hierarchy_level as number) < actorLevel) {
      return NextResponse.json({ error: 'Cannot assign a role above your own level' }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (role_id) updates.role_id = role_id;
  if (seat_type) updates.seat_type = seat_type;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('organization_memberships')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update membership', details: error.message }, { status: 500 });
  }

  // Audit log
  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user.id,
    actor_type: 'user',
    action: role_id ? 'member.role_changed' : seat_type ? 'member.seat_type_changed' : 'member.updated',
    entity_type: 'membership',
    resource_type: 'membership',
    entity_id: id,
    changes: { before: { role_id: membership.role_id }, after: updates },
    metadata: {},
  }).then(() => {});

  return NextResponse.json({ success: true, membership: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('*, roles!organization_memberships_role_id_fkey(hierarchy_level)')
    .eq('id', id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  const orgId = membership.organization_id as string;

  // Cannot remove self via this endpoint (use /leave instead)
  if (membership.user_id === user.id) {
    return NextResponse.json({ error: 'Use /leave endpoint to remove yourself' }, { status: 400 });
  }

  // Permission check
  const { data: hasPerm } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: 'manage',
    p_resource: 'member',
    p_scope: 'organization',
    p_scope_id: orgId,
  });

  if (!hasPerm) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Hierarchy: can only remove lower-ranked members
  const { data: actorMem } = await supabase
    .from('organization_memberships')
    .select('roles!organization_memberships_role_id_fkey(hierarchy_level)')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .single();

  const actorLevel = ((actorMem as Record<string, unknown>)?.roles as Record<string, number>)?.hierarchy_level ?? 99;
  const targetLevel = ((membership as Record<string, unknown>).roles as Record<string, number>)?.hierarchy_level ?? 99;

  if (targetLevel <= actorLevel) {
    return NextResponse.json({ error: 'Cannot remove a member with equal or higher rank' }, { status: 403 });
  }

  const { error } = await supabase.from('organization_memberships').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member', details: error.message }, { status: 500 });
  }

  // Decrement seat count
  const seatKey = membership.seat_type === 'internal' ? 'internal_seats_used' : 'external_seats_used';
  const { data: alloc } = await supabase
    .from('seat_allocations')
    .select(seatKey)
    .eq('organization_id', orgId)
    .single();

  if (alloc) {
    const current = (alloc as Record<string, number>)[seatKey] ?? 0;
    await supabase
      .from('seat_allocations')
      .update({ [seatKey]: Math.max(0, current - 1) })
      .eq('organization_id', orgId);
  }

  // Audit log
  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user.id,
    actor_type: 'user',
    action: 'member.removed',
    entity_type: 'membership',
    resource_type: 'membership',
    entity_id: id,
    changes: {},
    metadata: { removed_user_id: membership.user_id },
  }).then(() => {});

  return NextResponse.json({ success: true });
}
