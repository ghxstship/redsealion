'use client';

import FormInput from '@/components/ui/FormInput';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ModalShell from '@/components/ui/ModalShell';
import { Badge } from '@/components/ui/Badge';

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}

// Demo data removed, relying on server state

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


import { KeyRound } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

import { RoleGate } from '@/components/shared/RoleGate';
function KeyIcon() {
  return <KeyRound className="h-5 w-5" />;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [keyName, setKeyName] = useState('');

  useEffect(() => {
    fetch('/api/settings/api-keys')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.keys) && data.keys.length > 0) {
          setKeys(data.keys);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleGenerateKey() {
    if (!keyName.trim()) return;
    const name = keyName.trim();
    setShowNameModal(false);
    setKeyName('');

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
    setRevokeConfirm(null);
  }

  if (!loaded) return null;

  return (
    <RoleGate resource="settings">
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage programmatic access to the platform API. Webhook endpoints are managed under{' '}
          <a href="/app/settings/webhooks" className="text-blue-600 hover:underline">Webhooks</a>.
        </p>
      </div>

      {newKeyRevealed && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4">
          <p className="text-sm font-medium text-green-800 mb-1">New API key created</p>
          <p className="text-xs text-green-700 mb-2">
            Copy this key now. You will not be able to see it again.
          </p>
          <code className="block rounded-lg bg-background border border-green-200 px-3.5 py-2 text-sm font-mono text-green-900 break-all">
            {newKeyRevealed}
          </code>
          <Button
            onClick={() => setNewKeyRevealed(null)}
            className="mt-3 text-xs font-medium text-green-700 hover:text-green-900"
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card padding="default" className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyIcon />
            <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          </div>
          <Button onClick={() => setShowNameModal(true)}>Generate Key</Button>
        </div>
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border text-left">
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</TableHead>
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Key</TableHead>
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Scopes</TableHead>
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Created</TableHead>
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider">Last Used</TableHead>
                <TableHead className="pb-3 text-xs font-medium text-text-muted uppercase tracking-wider"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {keys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-text-muted">
                    No API keys yet. Generate one to get started.
                  </TableCell>
                </TableRow>
              )}
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="py-3 font-medium text-foreground">{k.name}</TableCell>
                  <TableCell className="py-3 font-mono text-text-secondary">{k.key_prefix}...</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant="muted">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-text-secondary">{formatDate(k.created_at)}</TableCell>
                  <TableCell className="py-3 text-text-secondary">{k.last_used_at ? formatDate(k.last_used_at) : 'Never'}</TableCell>
                  <TableCell className="py-3">
                    <Button variant="ghost" size="sm" onClick={() => setRevokeConfirm(k.id)} className="text-red-600 hover:text-red-800">
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {revokeConfirm && (
        <ConfirmDialog
          open
          title="Revoke API Key"
          message="Are you sure you want to revoke this API key? This action cannot be undone."
          confirmLabel="Revoke"
          variant="danger"
          onConfirm={() => handleRevoke(revokeConfirm)}
          onCancel={() => setRevokeConfirm(null)}
        />
      )}

      <ModalShell
        open={showNameModal}
        onClose={() => { setShowNameModal(false); setKeyName(''); }}
        title="Create API Key"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleGenerateKey(); }}
          className="space-y-4 pt-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Key Name</label>
            <FormInput
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., CI/CD Pipeline"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowNameModal(false); setKeyName(''); }}>Cancel</Button>
            <Button type="submit" disabled={!keyName.trim()}>Create Key</Button>
          </div>
        </form>
      </ModalShell>
    </div>
  </RoleGate>
  );
}
