import { RoleGate } from '@/components/shared/RoleGate';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="marketplace">{children}</RoleGate>;
}
