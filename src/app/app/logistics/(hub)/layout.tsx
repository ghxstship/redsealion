import { RoleGate } from '@/components/shared/RoleGate';

export default function LogisticsHubLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="warehouse">{children}</RoleGate>;
}
