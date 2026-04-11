'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function FabricationHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="fabrication">
      {children}
    </RoleGate>
  );
}
