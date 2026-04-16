import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Events | FlyteDeck',
  description: 'Manage events, activations, and locations.',
};

export default async function EventsLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('events'))) return <AccessDenied />;
  return <>{children}</>;
}
