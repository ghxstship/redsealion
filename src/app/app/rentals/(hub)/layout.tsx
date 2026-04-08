'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function RentalsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'manager', 'team_member']}>
      {children}
    </RoleGate>
  );
}
