import { RoleGate } from '@/components/shared/RoleGate';

export default function ExpensesHubLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate resource="expenses">{children}</RoleGate>;
}
