'use client';

/**
 * Automation run history — shows recent executions with status.
 *
 * @module components/admin/automations/AutomationRunHistory
 */

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface RunEntry {
  id: string;
  automation_name: string | null;
  status: string;
  trigger_data: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface AutomationRunHistoryProps {
  automationId?: string; // Filter to specific automation
  limit?: number;
}

export default function AutomationRunHistory({
  automationId,
  limit = 20,
}: AutomationRunHistoryProps) {
  const [runs, setRuns] = useState<RunEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (automationId) params.set('automation_id', automationId);

      const res = await fetch(`/api/automations/runs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [automationId, limit]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const statusIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 size={14} className="text-green-500" />,
    failed: <XCircle size={14} className="text-red-500" />,
    running: <Clock size={14} className="text-blue-500 animate-pulse" />,
  };

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Activity size={14} className="text-text-muted" />
          Run History
        </h3>
        {runs.length > 0 && (
          <span className="text-xs text-text-muted">{runs.length} runs</span>
        )}
      </div>

      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-6 text-center text-xs text-text-muted">Loading…</div>
        ) : runs.length === 0 ? (
          <EmptyState message="No automation runs yet" className="border-0 shadow-none px-2 py-8" />
        ) : (
          runs.map((run) => (
            <div key={run.id} className="flex items-center gap-3 px-5 py-3">
              {statusIcons[run.status] ?? statusIcons.completed}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {run.automation_name ?? 'Automation'}
                </p>
                {run.error_message && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">
                    {run.error_message}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-text-muted flex-shrink-0">
                {timeAgo(run.started_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
