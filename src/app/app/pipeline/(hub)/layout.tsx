'use client';
import { RoleGate } from '@/components/shared/RoleGate';

export default function PipelineHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="pipeline">
      {children}
    </RoleGate>
  );
}
