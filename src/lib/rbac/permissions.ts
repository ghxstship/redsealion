/**
 * RBAC — Server-Side Permission Resolution
 *
 * Implements the check_permission algorithm.
 * This module provides the TypeScript counterpart to the Postgres
 * check_permission function for use in API routes and middleware.
 *
 * @module lib/rbac/permissions
 */
import { createClient } from '@/lib/supabase/server';
import type {
  RoleScope,
  PermissionAction,
  PermissionResource,
} from '@/types/rbac';
import { SYSTEM_ROLE_IDS } from '@/types/rbac';

interface PermissionCheckResult {
  allowed: boolean;
  userId: string;
  organizationId: string | null;
  roleId: string | null;
  hierarchyLevel: number | null;
}

/**
 * Check whether the authenticated user has permission to perform
 * an action on a resource within a scope.
 */
export async function checkPermission(
  action: PermissionAction,
  resource: PermissionResource,
  scope: RoleScope,
  scopeId: string | null = null,
): Promise<PermissionCheckResult | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const userId = user.id;

  // Determine role from membership in the target scope
  let roleId: string | null = null;
  let hierarchyLevel: number | null = null;
  let organizationId: string | null = null;

  if (scope === 'organization' && scopeId) {
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('role_id, organization_id')
      .eq('user_id', userId)
      .eq('organization_id', scopeId)
      .eq('status', 'active')
      .single();

    if (membership) {
      roleId = membership.role_id as string;
      organizationId = membership.organization_id as string;
    }
  } else if (scope === 'team' && scopeId) {
    const { data: membership } = await supabase
      .from('team_memberships')
      .select('role_id, organization_id')
      .eq('user_id', userId)
      .eq('team_id', scopeId)
      .eq('status', 'active')
      .single();

    if (membership) {
      roleId = membership.role_id as string;
      organizationId = membership.organization_id as string;
    }
  } else if (scope === 'project' && scopeId) {
    const { data: membership } = await supabase
      .from('project_memberships')
      .select('role_id, organization_id')
      .eq('user_id', userId)
      .eq('project_id', scopeId)
      .eq('status', 'active')
      .single();

    if (membership) {
      roleId = membership.role_id as string;
      organizationId = membership.organization_id as string;
    }
  }

  if (!roleId) {
    return {
      allowed: false,
      userId,
      organizationId,
      roleId: null,
      hierarchyLevel: null,
    };
  }

  // Get hierarchy level
  const { data: role } = await supabase
    .from('roles')
    .select('hierarchy_level')
    .eq('id', roleId)
    .single();

  hierarchyLevel = role ? (role.hierarchy_level as number) : null;

  // Permission check delegated to Postgres RPC function below

  // Use RPC call for complex permission check (delegated to Postgres function)
  const { data: allowed } = await supabase.rpc('check_permission', {
    p_user_id: userId,
    p_action: action,
    p_resource: resource,
    p_scope: scope,
    p_scope_id: scopeId,
  });

  return {
    allowed: allowed === true,
    userId,
    organizationId,
    roleId,
    hierarchyLevel,
  };
}

/**
 * Enforce hierarchy ceiling: the actor cannot assign/invite to
 * a role with a lower hierarchy_level than their own.
 */
export function enforceHierarchyCeiling(
  actorHierarchyLevel: number,
  targetRoleHierarchyLevel: number,
): boolean {
  return targetRoleHierarchyLevel >= actorHierarchyLevel;
}

/**
 * Check if a user is the sole owner of an organization.
 * Used to prevent the last owner from leaving.
 */
export async function isSoleOwner(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data: ownerMemberships } = await supabase
    .from('organization_memberships')
    .select('id, user_id')
    .eq('organization_id', organizationId)
    .eq('role_id', SYSTEM_ROLE_IDS.OWNER)
    .eq('status', 'active');

  if (!ownerMemberships || ownerMemberships.length === 0) return false;
  if (ownerMemberships.length === 1 && ownerMemberships[0].user_id === userId) return true;
  return false;
}
