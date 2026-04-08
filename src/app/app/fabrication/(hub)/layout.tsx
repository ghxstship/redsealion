'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function FabricationHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'manager', 'team_member']}>
      {children}
    </RoleGate>
  );
}
