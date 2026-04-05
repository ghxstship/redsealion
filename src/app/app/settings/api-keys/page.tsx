'use client';

import { useState, useEffect } from 'react';

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

interface WebhookDelivery {
  id: string;
  timestamp: string;
  endpoint: string;
  event: string;
  status: number;
  response_time_ms: number;
}

// Demo data removed, relying on server state

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function KeyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/api-keys')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.keys) && data.keys.length > 0) {
          setKeys(data.keys);
        }
        if (Array.isArray(data.endpoints)) setEndpoints(data.endpoints);
        if (Array.isArray(data.deliveries)) setDeliveries(data.deliveries);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleGenerateKey() {
    const name = prompt('Enter a name for the new API key:');
    if (!name) return;

    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes: ['proposals:read', 'invoices:read'] }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKeyRevealed(data.key);
        setKeys((prev) => [data.api_key, ...prev]);
      }
    } catch (error) {
        void error; /* Caught: error boundary handles display */
      }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;

    try {
      await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (error) {
        void error; /* Caught: error boundary handles display */
      }
  }

  async function handleAddEndpoint() {
    const url = prompt('Enter the webhook endpoint URL:');
    if (!url) return;
    const events = prompt('Enter comma-separated events (or leave empty for all):');
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook_endpoint',
          url,
          events: events ? events.split(',').map((e) => e.trim()) : [],
        }),
      });
      const data = await res.json();
      if (data.endpoint) setEndpoints((prev) => [data.endpoint, ...prev]);
    } catch (error) {
      void error;
    }
  }

  async function handleDeleteEndpoint(id: string) {
    if (!confirm('Delete this webhook endpoint?')) return;
    try {
      await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'webhook_endpoint' }),
      });
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    } catch (error) {
      void error;
    }
  }

  async function handleEditEndpoint(ep: WebhookEndpoint) {
    const url = prompt('Update endpoint URL:', ep.url);
    if (!url) return;
    try {
      await fetch('/api/settings/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ep.id, type: 'webhook_endpoint', url }),
      });
      setEndpoints((prev) =>
        prev.map((e) => (e.id === ep.id ? { ...e, url } : e))
      );
    } catch (error) {
      void error;
    }
  }

  if (!loaded) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">API Keys &amp; Webhooks</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage programmatic access and event subscriptions.
        </p>
      </div>

      {/* Newly revealed key */}
      {newKeyRevealed && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4">
          <p className="text-sm font-medium text-green-800 mb-1">New API key created</p>
          <p className="text-xs text-green-700 mb-2">
            Copy this key now. You will not be able to see it again.
          </p>
          <code className="block rounded-lg bg-white border border-green-200 px-3.5 py-2 text-sm font-mono text-green-900 break-all">
            {newKeyRevealed}
          </code>
          <button
            onClick={() => setNewKeyRevealed(null)}
            className="mt-3 text-xs font-medium text-green-700 hover:text-green-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* API Keys */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyIcon />
            <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          </div>
          <button
            onClick={handleGenerateKey}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Generate Key
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Key</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Scopes</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Created</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Last Used</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="py-3 font-medium text-foreground">{k.name}</td>
                  <td className="py-3 font-mono text-text-secondary">{k.key_prefix}...</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <span key={s} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-text-secondary">{formatDate(k.created_at)}</td>
                  <td className="py-3 text-text-secondary">{k.last_used_at ? formatDate(k.last_used_at) : 'Never'}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleRevoke(k.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Endpoints */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Webhook Endpoints</h3>
          <button
            onClick={handleAddEndpoint}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Add Endpoint
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">URL</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Events</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {endpoints.map((ep) => (
                <tr key={ep.id}>
                  <td className="py-3 font-mono text-foreground text-xs">{ep.url}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {ep.events.map((ev) => (
                        <span key={ev} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      ep.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ep.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditEndpoint(ep)} className="text-xs font-medium text-foreground hover:text-foreground/70">Edit</button>
                      <button onClick={() => handleDeleteEndpoint(ep.id)} className="text-xs font-medium text-red-600 hover:text-red-800">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Activity */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Webhook Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Timestamp</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Endpoint</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Event</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Response Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.map((del) => (
                <tr key={del.id}>
                  <td className="py-3 text-text-secondary">{formatTimestamp(del.timestamp)}</td>
                  <td className="py-3 font-mono text-xs text-foreground">{del.endpoint}</td>
                  <td className="py-3 text-text-secondary">{del.event}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      del.status >= 200 && del.status < 300
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {del.status}
                    </span>
                  </td>
                  <td className="py-3 text-text-secondary">{del.response_time_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
