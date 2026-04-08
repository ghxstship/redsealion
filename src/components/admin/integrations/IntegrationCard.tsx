'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface IntegrationCardProps {
  platform: string;
  displayName: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt: string | null;
}

export function IntegrationCard({
  platform,
  displayName,
  description,
  category,
  status,
  lastSyncAt,
}: IntegrationCardProps) {
  const [connecting, setConnecting] = useState(false);

  const statusColors: Record<string, string> = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-800',
  };

  const categoryLabels: Record<string, string> = {
    crm: 'CRM',
    accounting: 'Accounting',
    pm: 'Project Management',
    calendar: 'Calendar',
    messaging: 'Messaging',
    automation: 'Automation',
  };

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch(`/api/integrations/${platform}/connect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background px-5 py-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-secondary text-sm font-semibold text-text-secondary">
            {displayName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{displayName}</h3>
            <p className="text-xs text-text-muted">{categoryLabels[category] ?? category}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] ?? statusColors.disconnected}`}>
          {status}
        </span>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>

      {lastSyncAt && (
        <p className="text-xs text-text-muted">
          Last synced: {new Date(lastSyncAt).toLocaleString()}
        </p>
      )}

      <div className="mt-auto pt-2 flex gap-2">
        {status === 'connected' ? (
          <>
            <a
              href={`/app/integrations/${platform}`}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >
              Configure
            </a>
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                await fetch(`/api/integrations/${platform}/sync`, { method: 'POST' });
              }}
            >
              Sync Now
            </Button>
          </>
        ) : (
          <Button size="sm" className="w-full" onClick={handleConnect}
            disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </div>
    </div>
  );
}
