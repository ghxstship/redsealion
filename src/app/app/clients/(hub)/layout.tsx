'use client';
import { RoleGate } from '@/components/shared/RoleGate';
import { TierGate } from '@/components/shared/TierGate';

export default function ClientsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="clients">
      <TierGate feature="clients">
        {children}
      </TierGate>
    </RoleGate>
  );
}
