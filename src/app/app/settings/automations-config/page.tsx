'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

interface AutomationRun {
  id: string;
  name: string;
  trigger: string;
  status: 'success' | 'failed' | 'skipped';
  duration: string;
  timestamp: string;
}

// Fallback runs mock removed

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
  const [runs, setRuns] = useState<AutomationRun[]>([]);

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
          checked ? 'bg-foreground' : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform ${
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
      <Card>
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
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
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
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
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
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
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
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
          </div>
        </div>
      </Card>

      {/* Default Actions */}
      <Card>
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
      </Card>

      {/* Recent Runs */}
      <Card>
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
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground font-medium">{run.name}</td>
                  <td className="py-3 text-text-secondary font-mono text-xs">{run.trigger}</td>
                  <td className="py-3">
                    <StatusBadge status={run.status} colorMap={statusBadge} />
                  </td>
                  <td className="py-3 text-text-secondary">{run.duration}</td>
                  <td className="py-3 text-text-secondary">{run.timestamp}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr className="border-b border-border last:border-0">
                  <td colSpan={5} className="py-6 text-center text-sm text-text-muted">
                    No recent automation runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/automations"
          className="text-sm font-medium text-foreground hover:underline underline-offset-2"
        >
          Manage automation rules &rarr;
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
