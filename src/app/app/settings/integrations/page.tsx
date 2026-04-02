'use client';

const integrations = [
  { id: 'int_001', platform: 'Salesforce', description: 'Sync clients and proposals to Salesforce CRM.', enabled: false, category: 'CRM' },
  { id: 'int_002', platform: 'HubSpot', description: 'Export client and deal data to HubSpot.', enabled: true, category: 'CRM' },
  { id: 'int_003', platform: 'QuickBooks', description: 'Sync invoices and payments to QuickBooks Online.', enabled: false, category: 'Accounting' },
  { id: 'int_004', platform: 'Xero', description: 'Sync invoices and expenses to Xero.', enabled: false, category: 'Accounting' },
  { id: 'int_005', platform: 'Slack', description: 'Send proposal notifications to Slack channels.', enabled: true, category: 'Communication' },
  { id: 'int_006', platform: 'Google Workspace', description: 'Sync calendar events and contacts.', enabled: false, category: 'Productivity' },
  { id: 'int_007', platform: 'Microsoft 365', description: 'Calendar sync and Teams notifications.', enabled: false, category: 'Productivity' },
  { id: 'int_008', platform: 'Zapier', description: 'Connect to 5,000+ apps through Zapier webhooks.', enabled: false, category: 'Automation' },
  { id: 'int_009', platform: 'Make', description: 'Build custom integrations with Make scenarios.', enabled: false, category: 'Automation' },
  { id: 'int_010', platform: 'Stripe', description: 'Process payments and manage subscriptions.', enabled: true, category: 'Payments' },
  { id: 'int_011', platform: 'DocuSign', description: 'Send contracts for e-signature via DocuSign.', enabled: false, category: 'Documents' },
];

const categories = ['CRM', 'Accounting', 'Communication', 'Productivity', 'Automation', 'Payments', 'Documents'];

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="mt-1 text-sm text-text-secondary">Connect third-party tools and services.</p>
      </div>

      {categories.map((category) => {
        const items = integrations.filter((i) => i.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{category}</h3>
            <div className="space-y-3">
              {items.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-white px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{integration.platform}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{integration.description}</p>
                  </div>
                  <button
                    className={`relative ml-4 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      integration.enabled ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        integration.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
