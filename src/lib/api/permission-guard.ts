import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PlatformRole, ProjectRole } from '@/lib/permissions';
import {
  type PermissionResource,
  type PermissionAction,
  getDefaultPermission,
  getDefaultProjectPermission,
} from '@/lib/permissions';
import {
  canAccessFeature,
  getRequiredTier,
  getTierLabel,
  type FeatureKey,
} from '@/lib/subscription';
import type { SubscriptionTier } from '@/types/database';

interface PermissionCheckResult {
  allowed: boolean;
  role: PlatformRole;
  /** Project-scoped role when the check ran in project scope. */
  projectRole?: ProjectRole;
  userId: string;
  organizationId: string;
  /** True when access was denied due to subscription tier, not role */
  tierBlocked?: boolean;
}

/**
 * Resolves the caller's project-scoped role for a given project.
 * Returns null if the user has no accepted project membership.
 * Reads from project_users (canonical) — migration 00148.
 */
export async function resolveProjectMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string,
): Promise<{ projectId: string; role: ProjectRole } | null> {
  const { data } = await supabase
    .from('project_users')
    .select('project_id, role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('invite_status', 'accepted')
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    projectId: data.project_id as string,
    role: data.role as ProjectRole,
  };
}

/**
 * Resolves the current user's active organization membership.
 * This is the canonical way to look up a user's org + role — reads exclusively
 * from the RBAC organization_memberships + roles tables.
 *
 * Returns the role name directly as a PlatformRole. No legacy mapping.
 */
export async function resolveUserMembership(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id, role_id, roles(name, hierarchy_level, scope)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership) return null;

  const roleName = (membership as Record<string, unknown>).roles
    ? ((membership as Record<string, unknown>).roles as Record<string, unknown>).name as string
    : 'collaborator';
  const hierarchyLevel = (membership as Record<string, unknown>).roles
    ? ((membership as Record<string, unknown>).roles as Record<string, unknown>).hierarchy_level as number
    : 99;

  // Direct cast — role names in DB are canonical PlatformRole values
  const role = roleName as PlatformRole;

  return {
    organizationId: membership.organization_id as string,
    roleId: membership.role_id as string,
    role,
    roleName,
    hierarchyLevel,
  };
}

/**
 * Unified permission check — reads from RBAC tables exclusively.
 *
 * Resolution order:
 * 1. Resolve user's active organization_membership.
 * 2. If `requireFeature`, verify org's subscription tier.
 * 3. Try RBAC check_permission() RPC.
 * 4. Fall back to the in-code default permission matrix.
 */
export async function checkPermission(
  resource: PermissionResource,
  action: PermissionAction,
  requireFeature?: FeatureKey,
  projectId?: string,
): Promise<PermissionCheckResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const membership = await resolveUserMembership(supabase, user.id);
  if (!membership) return null;

  const { role, organizationId } = membership;

  // --- Subscription tier gate (if feature specified) ---
  if (requireFeature) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single();

    const tier = (org?.subscription_tier as SubscriptionTier) ?? 'access';

    if (!canAccessFeature(tier, requireFeature)) {
      return {
        allowed: false,
        role,
        userId: user.id,
        organizationId,
        tierBlocked: true,
      };
    }
  }

  // Developer, owner, and admin always have full access
  if (role === 'developer' || role === 'owner' || role === 'admin') {
    return { allowed: true, role, userId: user.id, organizationId };
  }

  // --- Project-scoped authorization (canonical) ---
  // When the caller passes a projectId, resolve the project role and consult
  // DEFAULT_PROJECT_PERMISSIONS first. Project-scoped bundles take precedence
  // over platform fallback for project-scoped resources. If the user has no
  // project membership OR the bundle denies, fall through to the platform
  // matrix below (which will likely deny for external roles).
  let projectRole: ProjectRole | undefined;
  if (projectId) {
    const pm = await resolveProjectMembership(supabase, user.id, projectId);
    if (pm) {
      projectRole = pm.role;
      const projectAllowed = getDefaultProjectPermission(pm.role, resource, action);
      if (projectAllowed) {
        return { allowed: true, role, projectRole, userId: user.id, organizationId };
      }
    }
  }

  // --- RBAC RPC path ---
  const hmAction = action === 'view' ? 'read'
    : action === 'create' ? 'create'
    : action === 'edit' ? 'update'
    : action === 'delete' ? 'delete'
    : action;

  const { data: hmAllowed } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: hmAction,
    p_resource: resource,
    p_scope: projectId ? 'project' : 'organization',
    p_scope_id: projectId ?? organizationId,
  });

  if (hmAllowed === true) {
    return { allowed: true, role, projectRole, userId: user.id, organizationId };
  }

  // --- Fallback: in-code default permission matrix (no DB table) ---
  const allowed = getDefaultPermission(role, resource, action);

  return { allowed, role, projectRole, userId: user.id, organizationId };
}

/**
 * Guard an API route by permission + optional feature tier.
 * Returns null if access is granted, or a 401/403 NextResponse if denied.
 */
export async function requirePermission(
  resource: PermissionResource,
  action: PermissionAction,
  requireFeature?: FeatureKey,
  projectId?: string,
): Promise<NextResponse | null> {
  const result = await checkPermission(resource, action, requireFeature, projectId);

  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!result.allowed) {
    if (result.tierBlocked && requireFeature) {
      const requiredTier = getRequiredTier(requireFeature);
      return NextResponse.json(
        {
          error: 'Plan upgrade required',
          message: `This feature requires the ${getTierLabel(requiredTier)} plan or above.`,
          required_tier: requiredTier,
        },
        { status: 403 },
      );
    }

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
