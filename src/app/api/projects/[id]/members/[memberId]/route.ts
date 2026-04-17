import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { getProjectRoleId } from '@/types/rbac';
import type { ProjectRole } from '@/lib/permissions';

interface RouteContext { params: Promise<{ id: string; memberId: string }> }

const VALID_PROJECT_ROLES: ProjectRole[] = [
  'executive', 'production', 'management', 'crew', 'staff', 'talent',
  'vendor', 'client', 'sponsor', 'press', 'guest', 'attendee',
];

/**
 * PATCH /api/projects/[id]/members/[memberId] — Update a member's project role.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: projectId, memberId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { role } = body as { role?: string };

  if (!role || !VALID_PROJECT_ROLES.includes(role as ProjectRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_PROJECT_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const roleId = getProjectRoleId(role);
  if (!roleId) {
    return NextResponse.json({ error: `Unknown project role: ${role}` }, { status: 400 });
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_memberships')
    .update({ role_id: roleId })
    .eq('id', memberId)
    .eq('project_id', projectId)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update role', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/projects/[id]/members/[memberId] — Remove a member from a project.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id: projectId, memberId } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_memberships')
    .delete()
    .eq('id', memberId)
    .eq('project_id', projectId)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
