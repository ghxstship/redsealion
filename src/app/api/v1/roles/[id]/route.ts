import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH /api/v1/roles/:id — Update custom role
 * DELETE /api/v1/roles/:id — Delete custom role (reassigns affected members)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { display_name, description, hierarchy_level } = body as {
    display_name?: string;
    description?: string;
    hierarchy_level?: number;
  };

  const { data: role } = await ctx.supabase.from('roles').select().eq('id', id).single();
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.is_system) return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 403 });
  if (!role.organization_id) return NextResponse.json({ error: 'Cannot modify global roles' }, { status: 403 });

  const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
    p_user_id: ctx.userId,
    p_action: 'manage',
    p_resource: 'role',
    p_scope: 'organization',
    p_scope_id: role.organization_id,
  });

  if (!hasPerm) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const updates: Record<string, unknown> = {};
  if (display_name) updates.display_name = display_name;
  if (description !== undefined) updates.description = description;
  if (hierarchy_level !== undefined) {
    const { data: actorMem } = await ctx.supabase
      .from('organization_memberships')
      .select('roles!organization_memberships_role_id_fkey(hierarchy_level)')
      .eq('user_id', ctx.userId)
      .eq('organization_id', role.organization_id)
      .eq('status', 'active')
      .single();
    const actorLevel = ((actorMem as Record<string, unknown>)?.roles as Record<string, number>)?.hierarchy_level ?? 99;
    if (hierarchy_level <= actorLevel) {
      return NextResponse.json({ error: 'Custom role level must be below your own' }, { status: 403 });
    }
    updates.hierarchy_level = hierarchy_level;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await ctx.supabase
    .from('roles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update role', details: error.message }, { status: 500 });

  ctx.supabase.from('audit_log').insert({
    organization_id: role.organization_id,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'role.updated',
    entity_type: 'role',
    resource_type: 'role',
    entity_id: id,
    changes: { after: updates },
    metadata: {},
  }).then(() => {});

  return NextResponse.json({ success: true, role: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: role } = await ctx.supabase.from('roles').select().eq('id', id).single();
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role.is_system) return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 403 });
  if (!role.organization_id) return NextResponse.json({ error: 'Cannot delete global roles' }, { status: 403 });

  const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
    p_user_id: ctx.userId,
    p_action: 'manage',
    p_resource: 'role',
    p_scope: 'organization',
    p_scope_id: role.organization_id,
  });

  if (!hasPerm) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const { data: org } = await ctx.supabase
    .from('organizations')
    .select('default_member_role_id')
    .eq('id', role.organization_id)
    .single();

  const defaultRoleId = org?.default_member_role_id as string;
  if (defaultRoleId) {
    await ctx.supabase
      .from('organization_memberships')
      .update({ role_id: defaultRoleId })
      .eq('role_id', id)
      .eq('organization_id', role.organization_id);
  }

  const { error } = await ctx.supabase.from('roles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete role', details: error.message }, { status: 500 });

  ctx.supabase.from('audit_log').insert({
    organization_id: role.organization_id,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'role.deleted',
    entity_type: 'role',
    resource_type: 'role',
    entity_id: id,
    changes: {},
    metadata: { reassigned_to: defaultRoleId },
  }).then(() => {});

  return NextResponse.json({ success: true });
}
