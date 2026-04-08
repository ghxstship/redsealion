'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function CampaignsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'manager']}>
      {children}
    </RoleGate>
  );
}
