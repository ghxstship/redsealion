'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function LeadsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="leads">
      {children}
    </RoleGate>
  );
}
