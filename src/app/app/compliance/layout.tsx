import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Compliance | FlyteDeck',
  description: 'Track and manage compliance documents — COIs, licenses, permits, contracts, and certifications.',
};

export default async function ComplianceLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('compliance'))) return <AccessDenied />;
  return <>{children}</>;
}
