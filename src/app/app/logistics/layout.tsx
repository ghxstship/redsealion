import { RoleGate } from '@/components/shared/RoleGate';
import { TierGate } from '@/components/shared/TierGate';
import React from 'react';

export default function LogisticsModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <TierGate feature="warehouse">
      <RoleGate>{children}</RoleGate>
    </TierGate>
  );
}
