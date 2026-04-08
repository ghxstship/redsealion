'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function ProcurementHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'manager']}>
      {children}
    </RoleGate>
  );
}
