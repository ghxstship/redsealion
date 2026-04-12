'use client';

import { useState, useEffect } from 'react';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';

export default function WebhooksSettingsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEndpoints() {
      try {
        const res = await fetch('/api/webhooks/endpoints');
        if (res.ok) {
          const data = await res.json();
          setEndpoints(data);
        }
      } catch (err) {}
      setLoading(false);
    }
    fetchEndpoints();
  }, []);

  return (
    <>
    <TierGate feature="integrations">
      <div className="max-w-4xl space-y-6">
        <PageHeader
          title="Webhooks"
          subtitle="Manage outbound webhook endpoints for developer integrations."
        />

        <div className="flex justify-end mb-4">
          <Button onClick={() => { /* TODO: Implement webhook creation form */ }}>
            Add Endpoint
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-text-muted">Loading endpoints...</p>
        ) : endpoints.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-5 py-8 text-center text-sm text-text-muted">
            <p>No webhooks configured.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {endpoints.map((ep) => (
              <div key={ep.id} className="rounded-xl border border-border bg-background px-5 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{ep.name || 'Unnamed Webhook'}</h3>
                    <p className="text-xs text-text-muted mt-1">{ep.url}</p>
                    {ep.description && <p className="text-xs text-text-muted mt-1">{ep.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ep.is_active ? 'active' : 'inactive'} colorMap={{active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800'}} />
                    <Button
                      onClick={() => setDeletingId(ep.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-text-secondary">Subscribed Events:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {ep.events.length === 0 ? (
                      <span className="inline-flex items-center rounded bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                        All events (firehose)
                      </span>
                    ) : (
                      ep.events.map((evt: string) => (
                        <span key={evt} className="inline-flex items-center rounded bg-bg-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {evt}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TierGate>

    <ConfirmDialog
      open={!!deletingId}
      title="Delete Webhook"
      message="Are you sure you want to delete this webhook endpoint? It will stop receiving events immediately."
      variant="danger"
      confirmLabel="Delete"
      onConfirm={async () => {
        if (deletingId) {
          await fetch(`/api/webhooks/endpoints/${deletingId}`, { method: 'DELETE' });
          setEndpoints(endpoints.filter(e => e.id !== deletingId));
        }
        setDeletingId(null);
      }}
      onCancel={() => setDeletingId(null)}
    />
    </>
  );
}
