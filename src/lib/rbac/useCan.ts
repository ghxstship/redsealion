/**
 * useCan() — React hook for client-side project-role permission checks.
 *
 * Closes closure ticket C-UI-02.
 *
 * Reads membership + role from React context populated by the app
 * layout (see /app/layout.tsx) and consults DEFAULT_PROJECT_PERMISSIONS
 * for the authoritative answer. For privileged or sensitive actions,
 * always pair this client check with a server-side requirePermission()
 * guard — the client layer is advisory only.
 */

'use client';

import { createContext, useContext } from 'react';
import {
  type PermissionResource,
  type PermissionAction,
  type ProjectRole,
  type PlatformRole,
  getDefaultProjectPermission,
  getDefaultPermission,
} from '@/lib/permissions';

export interface RbacContextValue {
  userId: string | null;
  platformRole: PlatformRole | null;
  projectId: string | null;
  projectRole: ProjectRole | null;
}

const EMPTY: RbacContextValue = {
  userId: null, platformRole: null, projectId: null, projectRole: null,
};

export const RbacContext = createContext<RbacContextValue>(EMPTY);

export function useRbac(): RbacContextValue {
  return useContext(RbacContext);
}

/**
 * Returns true if the current user can perform `action` on `resource`
 * within their active project scope, or within their platform scope if
 * no project is active.
 *
 * Platform admins (developer/owner/admin) always receive true.
 */
export function useCan(resource: PermissionResource, action: PermissionAction): boolean {
  const { platformRole, projectRole } = useRbac();

  if (platformRole === 'developer' || platformRole === 'owner' || platformRole === 'admin') {
    return true;
  }

  if (projectRole) {
    if (getDefaultProjectPermission(projectRole, resource, action)) return true;
  }

  if (platformRole) {
    return getDefaultPermission(platformRole, resource, action);
  }

  return false;
}
