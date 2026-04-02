'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AutomationRun {
  id: string;
  name: string;
  trigger: string;
  status: 'success' | 'failed' | 'skipped';
  duration: string;
  timestamp: string;
}

const fallbackRuns: AutomationRun[] = [
  { id: '1', name: 'Send Welcome Email', trigger: 'client_created', status: 'success', duration: '1.2s', timestamp: '2 min ago' },
  { id: '2', name: 'Assign Default Tags', trigger: 'lead_created', status: 'success', duration: '0.8s', timestamp: '15 min ago' },
  { id: '3', name: 'Notify Team on Close', trigger: 'deal_won', status: 'failed', duration: '3.1s', timestamp: '1 hr ago' },
  { id: '4', name: 'Generate Invoice', trigger: 'proposal_accepted', status: 'success', duration: '2.4s', timestamp: '2 hrs ago' },
  { id: '5', name: 'Update CRM Stage', trigger: 'deal_stage_changed', status: 'skipped', duration: '0.1s', timestamp: '3 hrs ago' },
  { id: '6', name: 'Send Reminder', trigger: 'invoice_overdue', status: 'success', duration: '1.0s', timestamp: '4 hrs ago' },
  { id: '7', name: 'Archive Old Leads', trigger: 'scheduled', status: 'success', duration: '5.6s', timestamp: '6 hrs ago' },
  { id: '8', name: 'Sync to QuickBooks', trigger: 'invoice_created', status: 'failed', duration: '8.2s', timestamp: '8 hrs ago' },
  { id: '9', name: 'Crew Availability Check', trigger: 'booking_created', status: 'success', duration: '1.5s', timestamp: '12 hrs ago' },
  { id: '10', name: 'Send Crew Call Sheet', trigger: 'project_confirmed', status: 'success', duration: '2.0s', timestamp: '1 day ago' },
];

const statusBadge: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  skipped: 'bg-yellow-50 text-yellow-700',
};

export default function AutomationsConfigPage() {
  const [maxRunsPerHour, setMaxRunsPerHour] = useState(100);
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(1000);
  const [maxRetries, setMaxRetries] = useState(3);
  const [retryDelay, setRetryDelay] = useState(60);
  const [emailOnFailure, setEmailOnFailure] = useState(true);
  const [logAllRuns, setLogAllRuns] = useState(true);
  const [pauseOnFailures, setPauseOnFailures] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setSaving(false);
    }
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-foreground' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Automations</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Configure automation behavior and limits.
        </p>
      </div>

      {/* Execution Limits */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Execution Limits</h3>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Max Runs Per Hour
            </label>
            <input
              type="number"
              value={maxRunsPerHour}
              onChange={(e) => setMaxRunsPerHour(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Max Runs Per Day
            </label>
            <input
              type="number"
              value={maxRunsPerDay}
              onChange={(e) => setMaxRunsPerDay(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Max Retry Attempts
            </label>
            <input
              type="number"
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Retry Delay (seconds)
            </label>
            <input
              type="number"
              value={retryDelay}
              onChange={(e) => setRetryDelay(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
          </div>
        </div>
      </div>

      {/* Default Actions */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Default Actions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Send email notifications on failure</span>
            <Toggle checked={emailOnFailure} onChange={setEmailOnFailure} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Log all automation runs</span>
            <Toggle checked={logAllRuns} onChange={setLogAllRuns} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Pause automations on repeated failures</span>
            <Toggle checked={pauseOnFailures} onChange={setPauseOnFailures} />
          </div>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Recent Runs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Automation</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Trigger</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Status</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Duration</th>
                <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider pb-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {fallbackRuns.map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground font-medium">{run.name}</td>
                  <td className="py-3 text-text-secondary font-mono text-xs">{run.trigger}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[run.status]}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3 text-text-secondary">{run.duration}</td>
                  <td className="py-3 text-text-secondary">{run.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/automations"
          className="text-sm font-medium text-foreground hover:underline underline-offset-2"
        >
          Manage automation rules &rarr;
        </Link>
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
