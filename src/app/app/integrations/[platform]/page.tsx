'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { MappingEditor } from '@/components/admin/integrations/MappingEditor';

const PLATFORM_META: Record<string, { displayName: string; category: string }> = {
  salesforce: { displayName: 'Salesforce', category: 'crm' },
  hubspot: { displayName: 'HubSpot', category: 'crm' },
  pipedrive: { displayName: 'Pipedrive', category: 'crm' },
  quickbooks: { displayName: 'QuickBooks', category: 'accounting' },
  xero: { displayName: 'Xero', category: 'accounting' },
  clickup: { displayName: 'ClickUp', category: 'pm' },
  asana: { displayName: 'Asana', category: 'pm' },
  monday: { displayName: 'Monday.com', category: 'pm' },
  slack: { displayName: 'Slack', category: 'messaging' },
  google_calendar: { displayName: 'Google Calendar', category: 'calendar' },
  zapier: { displayName: 'Zapier', category: 'automation' },
};

const CRM_SOURCE_FIELDS = ['Contact Name', 'Email', 'Phone', 'Company', 'Title', 'Deal Value', 'Deal Stage'];
const CRM_TARGET_FIELDS = ['company_name', 'email', 'phone', 'industry', 'title', 'total_value', 'deal_stage'];

type ConfigTab = 'settings' | 'mappings' | 'sync_log';

const tabs: { key: ConfigTab; label: string }[] = [
  { key: 'settings', label: 'Settings' },
  { key: 'mappings', label: 'Field Mappings' },
  { key: 'sync_log', label: 'Sync Log' },
];

export default function IntegrationConfigPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = use(params);
  const [activeTab, setActiveTab] = useState<ConfigTab>('settings');
  const [syncDirection, setSyncDirection] = useState('bidirectional');
  const [syncFrequency, setSyncFrequency] = useState('realtime');
  const [saving, setSaving] = useState(false);

  const meta = PLATFORM_META[platform] ?? { displayName: platform, category: 'unknown' };

  async function handleSaveSettings() {
    setSaving(true);
    try {
      await fetch(`/api/integrations/${platform}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: { syncDirection, syncFrequency },
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMappings(mappings: { id: string; sourceField: string; targetField: string; transform: string }[]) {
    await fetch(`/api/integrations/${platform}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: { fieldMappings: mappings },
      }),
    });
  }

  return (
    <TierGate feature="integrations">
      <div className="mb-6">
        <Link
          href="/app/integrations"
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Integrations
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-sm font-semibold text-text-secondary">
            {meta.displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {meta.displayName}
            </h1>
            <p className="text-sm text-text-secondary">Configure your {meta.displayName} integration.</p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className="mb-6 rounded-xl border border-border bg-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span className="text-sm font-medium text-foreground">Not connected</span>
        </div>
        <button
          onClick={async () => {
            const res = await fetch(`/api/integrations/${platform}/connect`, { method: 'POST' });
            const data = await res.json();
            if (data.authUrl) window.location.href = data.authUrl;
          }}
          className="rounded-lg bg-foreground px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          Connect
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-border bg-white px-5 py-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Sync Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Sync Direction</label>
              <select
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              >
                <option value="bidirectional">Bidirectional</option>
                <option value="inbound">Inbound Only</option>
                <option value="outbound">Outbound Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Sync Frequency</label>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              >
                <option value="realtime">Real-time</option>
                <option value="hourly">Every hour</option>
                <option value="daily">Daily</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'mappings' && (
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <MappingEditor
            platform={platform}
            sourceFields={CRM_SOURCE_FIELDS}
            targetFields={CRM_TARGET_FIELDS}
            onSave={handleSaveMappings}
          />
        </div>
      )}

      {activeTab === 'sync_log' && (
        <div className="rounded-xl border border-border bg-white px-5 py-5">
          <p className="text-sm text-text-muted text-center py-8">
            No sync activity yet. Connect the integration and trigger a sync to see logs here.
          </p>
        </div>
      )}
    </TierGate>
  );
}
