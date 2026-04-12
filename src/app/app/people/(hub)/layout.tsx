import { RoleGate } from '@/components/shared/RoleGate';
import React from 'react';

export default function PeopleHubLayout({ children }: { children: React.ReactNode }) {
  return <><RoleGate>{children}</RoleGate></>;
}
