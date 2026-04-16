import { canView } from '@/lib/permissions/server';
import { AccessDenied } from '@/components/shared/AccessDenied';
import AutomationsHubTabs from '../AutomationsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';

export default async function AutomationsHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await canView('automations'))) return <AccessDenied />;

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
