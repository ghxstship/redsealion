import { RoleGate } from '@/components/shared/RoleGate';
import { TierGate } from '@/components/shared/TierGate';
import React from 'react';

export default async function TimeHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <TierGate feature="time_tracking">
      <RoleGate>{children}</RoleGate>
    </TierGate>
  );
}
