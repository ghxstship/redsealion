'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function ClientsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="clients">
      {children}
    </RoleGate>
  );
}
