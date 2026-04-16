/**
 * FlyteDeck — Server-Side Permission Helpers
 *
 * Lightweight permission checks for use in Server Components and layouts.
 * Uses React `cache()` for request-level deduplication — multiple
 * calls to `getSessionRole()` within the same request only hit
 * Supabase once.
 *
 * This is the SSOT for route-level access control in the App Router.
 * Client-side `RoleGate` is preserved for UI-level cosmetic gating only.
 */
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { castRelation } from '@/lib/supabase/cast-relation';
import {
  DEFAULT_PERMISSIONS,
  type PlatformRole,
  type PermissionResource,
  type PermissionAction,
  permKey,
} from '@/lib/permissions';

// ---------------------------------------------------------------------------
// Session role resolution (request-cached)
// ---------------------------------------------------------------------------

/**
 * Resolves the current user's platform role from the Supabase session.
 * Returns 'community' if no authenticated user is found.
 *
 * Wrapped in React `cache()` so that multiple layout layers calling this
 * within the same server request share a single Supabase round-trip.
 */
export const getSessionRole = cache(async (): Promise<PlatformRole> => {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return 'community';

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('roles(name)')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const roleData = castRelation<{ name: string }>(membership?.roles);
    return (roleData?.name as PlatformRole) || 'collaborator';
  } catch {
    return 'community';
  }
});

// ---------------------------------------------------------------------------
// Permission check helpers
// ---------------------------------------------------------------------------

/**
 * Checks if the current session role has `view` permission on a resource.
 * This is the standard server-side replacement for `<RoleGate resource="X">`.
 */
export async function canView(resource: PermissionResource): Promise<boolean> {
  const role = await getSessionRole();
  const key = permKey(resource, 'view');
  return DEFAULT_PERMISSIONS[role]?.[key] ?? false;
}

/**
 * General-purpose permission check for any resource + action combination.
 */
export async function canAccess(
  resource: PermissionResource,
  action: PermissionAction
): Promise<boolean> {
  const role = await getSessionRole();
  const key = permKey(resource, action);
  return DEFAULT_PERMISSIONS[role]?.[key] ?? false;
}
