import { RoleGate } from '@/components/shared/RoleGate';

export default function EventsHubLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="events">{children}</RoleGate>;
}
