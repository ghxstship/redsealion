import type { Metadata } from 'next';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Dispatch | FlyteDeck',
  description: 'Dispatch work orders to crew members.',
};

export default function DispatchLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="dispatch">{children}</RoleGate>;
}
