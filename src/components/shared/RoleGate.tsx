'use client';

import { usePermissions } from '@/components/shared/PermissionsProvider';
import type { PlatformRole } from '@/lib/permissions';
import type { PermissionResource } from '@/lib/permissions';

interface RoleGateProps {
  /** Block unless user has `view` on this resource */
  resource?: PermissionResource;
  /** Block unless user's role is in this list */
  allowedRoles?: PlatformRole[];
  children: React.ReactNode;
}

/**
 * RoleGate — client-side route guard.
 * Redirects unauthorized users to `/app` with an "unauthorized" toast.
 */
export function RoleGate({ resource, allowedRoles, children }: RoleGateProps) {
  const { role, can } = usePermissions();

  // Resource-based check: does this role have `view` on the resource?
  if (resource && !can(resource, 'view')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-4xl">🔒</div>
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-text-muted max-w-md">
          Your role ({role}) does not have permission to view this section.
        </p>
      </div>
    );
  }

  // Explicit role list check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="text-4xl">🔒</div>
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-text-muted max-w-md">
          Your role ({role}) does not have permission to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
