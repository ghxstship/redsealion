import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Equipment | FlyteDeck',
  description: 'Manage equipment inventory, check-ins, check-outs, and maintenance.',
};

export default async function EquipmentLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('equipment'))) return <AccessDenied />;
  return <>{children}</>;
}
