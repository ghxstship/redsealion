'use client';

import { TierGate } from '@/components/shared/TierGate';
import { IntegrationCard } from '@/components/admin/integrations/IntegrationCard';

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

export default function IntegrationsPage() {
  const categories = [...new Set(PLATFORMS.map((p) => p.category))];

  return (
    <TierGate feature="integrations">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Connect your tools to sync data and automate workflows.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.filter((p) => p.category === category).map((p) => (
              <IntegrationCard
                key={p.platform}
                platform={p.platform}
                displayName={p.displayName}
                description={p.description}
                category={p.category}
                status="disconnected"
                lastSyncAt={null}
              />
            ))}
          </div>
        </div>
      ))}
    </TierGate>
  );
}
