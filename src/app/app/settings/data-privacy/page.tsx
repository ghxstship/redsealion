'use client';

import { useState } from 'react';

const demoSessions = [
  { id: '1', browser: 'Chrome 124 on macOS', ip: '192.168.1.42', lastActive: '2 minutes ago', current: true },
  { id: '2', browser: 'Safari 17 on iPhone', ip: '10.0.0.15', lastActive: '3 hours ago', current: false },
];

export default function DataPrivacyPage() {
  const [auditRetention, setAuditRetention] = useState('90');
  const [deletedRetention, setDeletedRetention] = useState('30');
  const [sessions, setSessions] = useState(demoSessions);
  const [deletePassword, setDeletePassword] = useState('');
  const [orgConfirm, setOrgConfirm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/settings/data-export', { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data-export.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  function handleRevoke(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save retention settings
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your data and privacy settings.
        </p>
      </div>

      {/* Data Export */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">Data Export</h3>
        <p className="text-sm text-text-secondary mb-4">
          Export all of your organization&apos;s data as a JSON file including proposals, invoices, clients, assets, and users.
        </p>
        <p className="text-xs text-text-muted mb-4">
          This may take a few minutes for large organizations.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </div>

      {/* Data Retention */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Data Retention</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Keep Audit Logs
            </label>
            <select
              value={auditRetention}
              onChange={(e) => setAuditRetention(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Keep Deleted Records
            </label>
            <select
              value={deletedRetention}
              onChange={(e) => setDeletedRetention(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Connected Sessions */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Connected Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Browser</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">IP</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Last Active</th>
                <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">
                    {s.browser}
                    {s.current && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-text-secondary">{s.ip}</td>
                  <td className="py-3 text-text-secondary">{s.lastActive}</td>
                  <td className="py-3 text-right">
                    {!s.current && (
                      <button
                        onClick={() => handleRevoke(s.id)}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">No active sessions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-red-600 mb-5">Danger Zone</h3>
        <div className="space-y-6">
          {/* Delete Account */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Delete Account</h4>
            <p className="text-sm text-text-secondary mb-3">
              Permanently delete your user account. This does not delete the organization.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                />
              </div>
              <button
                disabled={!deletePassword}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="border-t border-red-100" />

          {/* Delete Organization */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Delete Organization</h4>
            <p className="text-sm text-text-secondary mb-3">
              Permanently delete the entire organization and all associated data. This action cannot be undone.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                  Type Organization Name to Confirm
                </label>
                <input
                  type="text"
                  value={orgConfirm}
                  onChange={(e) => setOrgConfirm(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                />
              </div>
              <button
                disabled={!orgConfirm}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
