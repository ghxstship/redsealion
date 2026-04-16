import type { Metadata } from 'next';
import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';

export const metadata: Metadata = {
  title: 'Expenses | FlyteDeck',
  description: 'Track and approve expenses.',
};

export default async function ExpensesLayout({ children }: { children: React.ReactNode }) {
  if (!(await canView('expenses'))) return <AccessDenied />;
  return <>{children}</>;
}
