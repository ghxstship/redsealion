import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { checkPermission, enforceHierarchyCeiling } from '@/lib/rbac/permissions';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/rbac/audit';

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const orgId = url.searchParams.get('organization_id') ?? ctx.organizationId;

  let query = ctx.supabase.from('roles').select().order('hierarchy_level', { ascending: true });

  if (orgId) {
    // System roles (org_id IS NULL) + custom roles for this org
    query = query.or(`organization_id.is.null,organization_id.eq.${orgId}`);
  } else {
    query = query.is('organization_id', null);
  }

  const { data: roles, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }

  return NextResponse.json({ roles: roles ?? [] });
}

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const { organization_id, name, display_name, description, scope, hierarchy_level, permission_ids } = body as {
    organization_id?: string;
    name?: string;
    display_name?: string;
    description?: string;
    scope?: string;
    hierarchy_level?: number;
    permission_ids?: string[];
  };

  if (!organization_id || !name || !display_name || !scope || hierarchy_level === undefined) {
    return NextResponse.json(
      { error: 'organization_id, name, display_name, scope, and hierarchy_level are required' },
      { status: 400 },
    );
  }

  // Permission check
  const perm = await checkPermission('manage', 'role', 'organization', organization_id);
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Hierarchy ceiling: custom role must be weaker than creator
  if (perm.hierarchyLevel !== null && !enforceHierarchyCeiling(perm.hierarchyLevel, hierarchy_level)) {
    return NextResponse.json(
      { error: 'Custom role hierarchy_level must be >= your own' },
      { status: 403 },
    );
  }

  const { data: role, error } = await ctx.supabase
    .from('roles')
    .insert({
      organization_id,
      name,
      display_name,
      description: description ?? null,
      scope,
      hierarchy_level,
      is_system: false,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error || !role) {
    return NextResponse.json(
      { error: 'Failed to create role', details: error?.message },
      { status: 500 },
    );
  }

  // Assign permissions if provided
  if (permission_ids && permission_ids.length > 0) {
    const permRows = permission_ids.map(pid => ({
      role_id: role.id as string,
      permission_id: pid,
      granted_by: ctx.userId,
    }));

    await ctx.supabase.from('role_permissions').insert(permRows);
  }

  writeAuditLog({
    organizationId: organization_id,
    actorId: ctx.userId,
    actorType: 'user',
    action: 'role.created',
    resourceType: 'role',
    resourceId: role.id as string,
    metadata: { name, scope, hierarchy_level, permission_count: permission_ids?.length ?? 0 },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true, role }, { status: 201 });
}
