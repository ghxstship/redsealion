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
 * Check whether the authenticated user has permission to perform an action
 * on a resource. Reads from the `permissions` table first; falls back to
 * hardcoded defaults from `src/lib/permissions.ts`.
 *
 * Returns the check result or null if the user is not authenticated.
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

  // Check for an org-level override in the permissions table
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
