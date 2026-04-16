import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Dispatch | FlyteDeck',
  description: 'Dispatch work orders to crew members.',
};

export default async function DispatchLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('dispatch'))) return <AccessDenied />;
  return <>{children}</>;
}
