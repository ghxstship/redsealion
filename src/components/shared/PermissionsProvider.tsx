'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { PermissionResource, PermissionAction } from '@/lib/permissions';

interface PermissionsContextType {
  role: string;
  permissions: Record<string, boolean>;
  can: (resource: PermissionResource, action: PermissionAction) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({
  role,
  permissions,
  children,
}: {
  role: string;
  permissions: Record<string, boolean>;
  children: ReactNode;
}) {
  const can = (resource: PermissionResource, action: PermissionAction) => {
    return permissions[`${resource}.${action}`] ?? false;
  };

  return (
    <PermissionsContext.Provider value={{ role, permissions, can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
