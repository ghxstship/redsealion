import type { Metadata } from 'next';
import { RoleGate } from '@/components/shared/RoleGate';

export const metadata: Metadata = {
  title: 'Crew Management | FlyteDeck',
  description: 'Manage crew members, availability, schedules, and skills.',
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="crew">{children}</RoleGate>;
}
