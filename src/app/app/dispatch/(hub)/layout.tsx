import { RoleGate } from '@/components/shared/RoleGate';

export default function DispatchHubLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="dispatch">{children}</RoleGate>;
}
