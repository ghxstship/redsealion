import type { Metadata } from 'next';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Equipment | FlyteDeck',
  description: 'Manage equipment inventory, check-ins, check-outs, and maintenance.',
};

export default function EquipmentLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="equipment">{children}</RoleGate>;
}
