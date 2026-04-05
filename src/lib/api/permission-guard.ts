import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole, SubscriptionTier } from '@/types/database';
import {
  type PermissionResource,
  type PermissionAction,
  getDefaultPermission,
} from '@/lib/permissions';
import {
  canAccessFeature,
  getRequiredTier,
  getTierLabel,
  type FeatureKey,
} from '@/lib/subscription';

interface PermissionCheckResult {
  allowed: boolean;
  role: OrganizationRole;
  userId: string;
  organizationId: string;
  /** True when access was denied due to subscription tier, not role */
  tierBlocked?: boolean;
}

/**
 * Resolves the current user's active organization membership.
 * This is the canonical way to look up a user's org + role — reads exclusively
 * from Harbor Master's organization_memberships + roles tables.
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
    : 'member';
  const hierarchyLevel = (membership as Record<string, unknown>).roles
    ? ((membership as Record<string, unknown>).roles as Record<string, unknown>).hierarchy_level as number
    : 99;

  // Map Harbor Master role names to legacy OrganizationRole enum
  const role: OrganizationRole =
    roleName === 'platform_admin' || roleName === 'platform_superadmin' ? 'super_admin'
    : roleName === 'owner' || roleName === 'org_owner' ? 'org_admin'
    : roleName === 'admin' || roleName === 'org_admin' ? 'org_admin'
    : roleName === 'project_manager' ? 'project_manager'
    : roleName === 'member' ? 'designer'
    : roleName === 'viewer' ? 'client_viewer'
    : roleName === 'external_collaborator' ? 'client_viewer'
    : 'designer';

  return {
    organizationId: membership.organization_id as string,
    roleId: membership.role_id as string,
    role,
    roleName,
    hierarchyLevel,
  };
}

/**
 * Unified permission check — reads exclusively from Harbor Master RBAC.
 *
 * Resolution order:
 * 1. Resolve user's active organization_membership.
 * 2. If `requireFeature`, verify org's subscription tier.
 * 3. Try Harbor Master check_permission() RPC.
 * 4. Fall back to the in-code default permission matrix.
 */
export async function checkPermission(
  resource: PermissionResource,
  action: PermissionAction,
  requireFeature?: FeatureKey,
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

    const tier = (org?.subscription_tier as SubscriptionTier) ?? 'free';

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

  // Super admins and org admins always have full access
  if (role === 'super_admin' || role === 'org_admin') {
    return { allowed: true, role, userId: user.id, organizationId };
  }

  // --- Harbor Master RPC path ---
  const hmAction = action === 'view' ? 'read'
    : action === 'create' ? 'create'
    : action === 'edit' ? 'update'
    : action === 'delete' ? 'delete'
    : action;

  const { data: hmAllowed } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: hmAction,
    p_resource: resource,
    p_scope: 'organization',
    p_scope_id: organizationId,
  });

  if (hmAllowed === true) {
    return { allowed: true, role, userId: user.id, organizationId };
  }

  // --- Fallback: in-code default permission matrix (no DB table) ---
  const allowed = getDefaultPermission(role, resource, action);

  return { allowed, role, userId: user.id, organizationId };
}

/**
 * Guard an API route by permission + optional feature tier.
 * Returns null if access is granted, or a 401/403 NextResponse if denied.
 */
export async function requirePermission(
  resource: PermissionResource,
  action: PermissionAction,
  requireFeature?: FeatureKey,
): Promise<NextResponse | null> {
  const result = await checkPermission(resource, action, requireFeature);

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
