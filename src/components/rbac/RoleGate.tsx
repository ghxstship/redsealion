/**
 * <RoleGate> — conditional render of children based on project/platform role.
 *
 * Closes closure ticket C-UI-02.
 *
 * Usage:
 *   <RoleGate resource="invoices" action="approve">
 *     <ApprovalButton />
 *   </RoleGate>
 *
 * Optional fallback renders when access is denied.
 */

'use client';

import type { ReactNode } from 'react';
import { useCan } from '@/lib/rbac/useCan';
import type { PermissionResource, PermissionAction } from '@/lib/permissions';

export interface RoleGateProps {
  resource: PermissionResource;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ resource, action, children, fallback = null }: RoleGateProps) {
  const allowed = useCan(resource, action);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
