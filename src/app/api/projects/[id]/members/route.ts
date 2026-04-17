import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { getProjectRoleId } from '@/types/rbac';
import type { ProjectRole } from '@/lib/permissions';

interface RouteContext { params: Promise<{ id: string }> }

const VALID_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff', 'talent',
  'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

/**
 * GET /api/projects/[id]/members — List members of a project.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_memberships')
    .select('id, user_id, role_id, created_at, users(full_name, email, avatar_url), roles:role_id(name)')
    .eq('project_id', id)
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members', details: error.message }, { status: 500 });
  }

  const members = (data ?? []).map((m) => ({
    id: m.id,
    user_id: m.user_id,
    full_name: (m.users as unknown as { full_name: string })?.full_name ?? '',
    email: (m.users as unknown as { email: string })?.email ?? '',
    avatar_url: (m.users as unknown as { avatar_url: string | null })?.avatar_url ?? null,
    role: ((m.roles as unknown as { name: string })?.name ?? 'collaborator') as ProjectRole,
    added_at: m.created_at,
  }));

  return NextResponse.json({ members });
}

/**
 * POST /api/projects/[id]/members — Add a member to a project.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { email, role, user_id } = body as { email?: string; role?: string; user_id?: string };

  if (!email && !user_id) {
    return NextResponse.json({ error: 'email or user_id is required' }, { status: 400 });
  }

  const projectRole = (role && VALID_PROJECT_ROLES.includes(role as ProjectRole))
    ? role as ProjectRole
    : 'production';

  const roleId = getProjectRoleId(projectRole);
  if (!roleId) {
    return NextResponse.json({ error: `Unknown project role: ${projectRole}` }, { status: 400 });
  }
  const supabase = await createClient();

  // Resolve user
  let targetUserId = user_id;
  if (!targetUserId && email) {
    const { data: foundUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    targetUserId = foundUser?.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify user is in the same org
  const { data: orgMember } = await supabase
    .from('organization_memberships')
    .select('user_id')
    .eq('user_id', targetUserId)
    .eq('organization_id', perm.organizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (!orgMember) {
    return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 });
  }

  const { data: membership, error: insertError } = await supabase
    .from('project_memberships')
    .insert({
      project_id: id,
      user_id: targetUserId,
      organization_id: perm.organizationId,
      role_id: roleId,
      joined_via: 'manual_add',
    })
    .select('id, user_id, role_id, created_at')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add member', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: membership }, { status: 201 });
}

/**
 * DELETE /api/projects/[id]/members — Remove a member from a project.
 * Query param: ?user_id=UUID
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const userId = request.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id query param is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('project_memberships')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
