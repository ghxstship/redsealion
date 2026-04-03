import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/types/database';
import {
  type PermissionResource,
  type PermissionAction,
  permKey,
  getDefaultPermission,
} from '@/lib/permissions';

interface PermissionCheckResult {
  allowed: boolean;
  role: OrganizationRole;
  userId: string;
  organizationId: string;
}

/**
 * Unified permission check — bridges the legacy RBAC matrix with Harbor Master.
 *
 * Resolution order:
 * 1. If the user has an organization_membership (Harbor Master), check via
 *    the Postgres check_permission() RPC for hierarchical role permissions.
 * 2. Fall back to the legacy users.role + permissions table override + default matrix.
 *
 * This ensures all existing domain routes continue working while Harbor Master
 * memberships are progressively adopted.
 */
export async function checkPermission(
  resource: PermissionResource,
  action: PermissionAction,
): Promise<PermissionCheckResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!userData) return null;

  const role = userData.role as OrganizationRole;
  const organizationId = userData.organization_id as string;

  // Super admins and org admins always have full access
  if (role === 'super_admin' || role === 'org_admin') {
    return { allowed: true, role, userId: user.id, organizationId };
  }

  // --- Harbor Master path: check organization_memberships + role_permissions ---
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('role_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (membership?.role_id) {
    // Map legacy action names to Harbor Master action names
    const hmAction = action === 'view' ? 'read'
      : action === 'create' ? 'create'
      : action === 'edit' ? 'update'
      : action === 'delete' ? 'delete'
      : action;

    const { data: allowed } = await supabase.rpc('check_permission', {
      p_user_id: user.id,
      p_action: hmAction,
      p_resource: resource,
      p_scope: 'organization',
      p_scope_id: organizationId,
    });

    if (allowed === true) {
      return { allowed: true, role, userId: user.id, organizationId };
    }

    // If Harbor Master explicitly denied and membership exists, still fall through
    // to legacy — Harbor Master permissions are additive during migration
  }

  // --- Legacy path: permissions table override → default matrix ---
  const key = permKey(resource, action);
  const { data: override } = await supabase
    .from('permissions')
    .select('allowed')
    .eq('organization_id', organizationId)
    .eq('role', role)
    .eq('resource', resource)
    .eq('action', action)
    .maybeSingle();

  const allowed = override ? (override.allowed as boolean) : getDefaultPermission(role, resource, action);

  return { allowed, role, userId: user.id, organizationId };
}

/**
 * Guard an API route by permission. Returns null if access is granted,
 * or a 401/403 NextResponse if denied.
 */
export async function requirePermission(
  resource: PermissionResource,
  action: PermissionAction,
): Promise<NextResponse | null> {
  const result = await checkPermission(resource, action);

  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Your role (${result.role.replace(/_/g, ' ')}) does not have ${action} access to ${resource.replace(/_/g, ' ')}.`,
      },
      { status: 403 },
    );
  }

  return null;
}
