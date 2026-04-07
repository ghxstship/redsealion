import { TierGate } from '@/components/shared/TierGate';
import { IntegrationCard } from '@/components/admin/integrations/IntegrationCard';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';

const PLATFORMS = [
  { platform: 'salesforce', displayName: 'Salesforce', description: 'Sync contacts, opportunities, and accounts with Salesforce CRM.', category: 'crm' },
  { platform: 'hubspot', displayName: 'HubSpot', description: 'Sync contacts, deals, and companies with HubSpot CRM.', category: 'crm' },
  { platform: 'pipedrive', displayName: 'Pipedrive', description: 'Sync contacts and deals with Pipedrive CRM.', category: 'crm' },
  { platform: 'quickbooks', displayName: 'QuickBooks', description: 'Sync invoices, payments, and customers with QuickBooks Online.', category: 'accounting' },
  { platform: 'xero', displayName: 'Xero', description: 'Sync invoices, payments, and contacts with Xero accounting.', category: 'accounting' },
  { platform: 'clickup', displayName: 'ClickUp', description: 'Create tasks and projects in ClickUp from proposals.', category: 'pm' },
  { platform: 'asana', displayName: 'Asana', description: 'Create tasks and projects in Asana from proposals.', category: 'pm' },
  { platform: 'monday', displayName: 'Monday.com', description: 'Create boards and items in Monday.com from proposals.', category: 'pm' },
  { platform: 'slack', displayName: 'Slack', description: 'Send notifications and updates to Slack channels.', category: 'messaging' },
  { platform: 'google_calendar', displayName: 'Google Calendar', description: 'Sync milestones and deadlines to Google Calendar.', category: 'calendar' },
  { platform: 'zapier', displayName: 'Zapier', description: 'Connect to thousands of apps via Zapier webhooks.', category: 'automation' },
];

const CATEGORY_LABELS: Record<string, string> = {
  crm: 'CRM',
  accounting: 'Accounting',
  pm: 'Project Management',
  messaging: 'Messaging',
  calendar: 'Calendar',
  automation: 'Automation',
};

async function getIntegrations() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];
const { data: integrations } = await supabase
      .from('integrations')
      .select('platform, status, last_sync_at')
      .eq('organization_id', ctx.organizationId);

    return integrations || [];
  } catch {
    return [];
  }
}

export default async function IntegrationsPage() {
  const categories = [...new Set(PLATFORMS.map((p) => p.category))];
  const activeIntegrations = await getIntegrations();

  const integrationsMap = new Map(
    activeIntegrations.map((i: { platform: string; status: string; last_sync_at: string | null }) => [i.platform, i])
  );

  return (
    <TierGate feature="integrations">
<PageHeader
        title="Integrations"
        subtitle="Connect your tools to sync data and automate workflows."
      />

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter((p) => p.category === category).map((p) => {
              const dbInt = integrationsMap.get(p.platform);
              return (
                <IntegrationCard
                  key={p.platform}
                  platform={p.platform}
                  displayName={p.displayName}
                  description={p.description}
                  category={p.category}
                  status={(dbInt?.status ?? 'disconnected') as 'disconnected' | 'connected' | 'error'}
                  lastSyncAt={dbInt?.last_sync_at ?? null}
                />
              );
            })}
          </div>
        </div>
      ))}
    </TierGate>
  );
}
