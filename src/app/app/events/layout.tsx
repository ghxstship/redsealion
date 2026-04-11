import type { Metadata } from 'next';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Events | FlyteDeck',
  description: 'Manage events, activations, and locations.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="events">{children}</RoleGate>;
}
