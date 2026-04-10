import AutomationsHubTabs from '../AutomationsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';

export default function AutomationsHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader
        title="Automations"
        subtitle="Automate workflows with event triggers and actions."
      >
        <Button href="/app/automations/new">New Automation</Button>
      </PageHeader>

      <AutomationsHubTabs />

      {children}
    </>
  );
}
