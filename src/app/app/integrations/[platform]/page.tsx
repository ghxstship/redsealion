'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { MappingEditor } from '@/components/admin/integrations/MappingEditor';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Button from '@/components/ui/Button';
import { PLATFORM_MAP, CATEGORY_FIELD_MAPPINGS } from '@/lib/integrations/platforms';

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
  
  const [isConnected, setIsConnected] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const meta = PLATFORM_MAP[platform] ?? { displayName: platform, category: 'unknown' };

  useEffect(() => {
    async function fetchData() {
      try {
        const [configRes, logsRes] = await Promise.all([
          fetch(`/api/integrations/${platform}`),
          fetch(`/api/integrations/${platform}/sync-logs`)
        ]);
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.integration) {
            setIsConnected(data.integration.status === 'connected');
            if (data.integration.config) {
              setSyncDirection(data.integration.config.syncDirection || 'bidirectional');
              setSyncFrequency(data.integration.config.syncFrequency || 'realtime');
            }
          }
        }
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setSyncLogs(logsData.logs || []);
        }
      } catch (err) {}
      setLoadingStatus(false);
    }
    fetchData();
  }, [platform]);

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
    <>
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
      <div className="mb-6 rounded-xl border border-border bg-background px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-text-muted'}`} />
          <span className="text-sm font-medium text-foreground">
            {loadingStatus ? 'Loading...' : isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        {isConnected ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDisconnectConfirm(true)}
          >
            Disconnect
          </Button>
        ) : (
          <button
            onClick={async () => {
              const res = await fetch(`/api/integrations/${platform}/connect`, { method: 'POST' });
              const data = await res.json();
              if (data.authUrl) window.location.href = data.authUrl;
            }}
            disabled={loadingStatus}
            className="rounded-lg bg-foreground px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Connect
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {/* Tab content */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-border bg-background px-5 py-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Sync Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Sync Direction</label>
              <select
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
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
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <MappingEditor
            platform={platform}
            sourceFields={CATEGORY_FIELD_MAPPINGS[meta.category]?.sourceFields ?? []}
            targetFields={CATEGORY_FIELD_MAPPINGS[meta.category]?.targetFields ?? []}
            onSave={handleSaveMappings}
          />
        </div>
      )}

      {activeTab === 'sync_log' && (
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          {syncLogs.length === 0 ? (
            <EmptyState
              message="No sync activity yet"
              description="Connect the integration and trigger a sync to see logs here."
            />
          ) : (
            <div className="space-y-4">
               {syncLogs.map((log: any) => (
                 <div key={log.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                   <div className="flex justify-between items-start mb-1">
                     <span className={`text-xs font-semibold ${log.status === 'failed' ? 'text-red-600' : 'text-green-600'}`}>
                       {log.status.toUpperCase()}
                     </span>
                     <span className="text-xs text-text-muted">
                       {new Date(log.started_at).toLocaleString()}
                     </span>
                   </div>
                   <p className="text-sm text-foreground">
                     {log.entity_count} {log.entity_type} {log.direction} processed.
                   </p>
                   {log.error_message && (
                     <p className="mt-1 text-xs text-red-500">Error: {log.error_message}</p>
                   )}
                 </div>
               ))}
            </div>
          )}
        </div>
      )}
    </TierGate>

    <ConfirmDialog
      open={showDisconnectConfirm}
      title="Disconnect Integration"
      message={`Are you sure you want to disconnect ${meta.displayName}? Data syncing will stop immediately.`}
      variant="danger"
      confirmLabel="Disconnect"
      onConfirm={async () => {
        await fetch(`/api/integrations/${platform}`, { method: 'DELETE' });
        setIsConnected(false);
        setShowDisconnectConfirm(false);
      }}
      onCancel={() => setShowDisconnectConfirm(false)}
    />
    </>
  );
}
