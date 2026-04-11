import AutomationsHubTabs from '../AutomationsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { RoleGate } from '@/components/shared/RoleGate';

export default function AutomationsHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGate resource="automations">
      <PageHeader
        title="Automations"
        subtitle="Automate workflows with event triggers and actions."
      >
        <Button href="/app/automations/new">New Automation</Button>
      </PageHeader>

      <AutomationsHubTabs />

      {children}
    </RoleGate>
  );
}
