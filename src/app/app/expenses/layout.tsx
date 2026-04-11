import type { Metadata } from 'next';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Expenses | FlyteDeck',
  description: 'Track and approve expenses.',
};

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="expenses">{children}</RoleGate>;
}
