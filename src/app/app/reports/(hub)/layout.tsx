'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function ReportsHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="reports">
      {children}
    </RoleGate>
  );
}
