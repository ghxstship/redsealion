import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Crew Management | FlyteDeck',
  description: 'Manage crew members, availability, schedules, and skills.',
};

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('crew'))) return <AccessDenied />;
  return <>{children}</>;
}
