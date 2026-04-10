import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance | FlyteDeck',
  description: 'Track and manage compliance documents — COIs, licenses, permits, contracts, and certifications.',
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
