import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { SYSTEM_ROLE_IDS } from '@/types/rbac';
import type { ProjectRole } from '@/lib/permissions';

interface RouteContext { params: Promise<{ id: string; memberId: string }> }

const VALID_PROJECT_ROLES: ProjectRole[] = ['creator', 'collaborator', 'viewer', 'vendor'];

const PROJECT_ROLE_MAP: Record<ProjectRole, string> = {
  creator: SYSTEM_ROLE_IDS.PROJECT_CREATOR,
  collaborator: SYSTEM_ROLE_IDS.PROJECT_COLLABORATOR,
  viewer: SYSTEM_ROLE_IDS.PROJECT_VIEWER,
  vendor: SYSTEM_ROLE_IDS.PROJECT_VENDOR,
};

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

  const roleId = PROJECT_ROLE_MAP[role as ProjectRole];
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
