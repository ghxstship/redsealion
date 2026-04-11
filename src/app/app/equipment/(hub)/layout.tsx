import { RoleGate } from '@/components/shared/RoleGate';

export default function EquipmentHubLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="equipment">{children}</RoleGate>;
}
