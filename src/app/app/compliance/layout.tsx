import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance | FlyteDeck',
  description: 'Track and manage compliance documents — COIs, licenses, permits, contracts, and certifications.',
};

import { RoleGate } from '@/components/shared/RoleGate';

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="compliance">{children}</RoleGate>;
}
