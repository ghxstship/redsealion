import { RoleGate } from '@/components/shared/RoleGate';
import CrewHubTabs from '../CrewHubTabs';

export default function CrewHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate resource="crew">
      <CrewHubTabs />
      {children}
    </RoleGate>
  );
}
