'use client';

/**
 * Task activity feed — surfaces audit log entries for the task entity.
 * Shows who changed what, when — critical for team visibility.
 *
 * @module components/admin/tasks/TaskActivityFeed
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Clock, User, ArrowRight, Edit3, Plus, Trash2,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  user_name: string | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <Plus size={12} />,
  updated: <Edit3 size={12} />,
  deleted: <Trash2 size={12} />,
  status_change: <ArrowRight size={12} />,
  assigned: <User size={12} />,
  completed: <CheckCircle2 size={12} />,
  commented: <AlertCircle size={12} />,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

interface TaskActivityFeedProps {
  taskId: string;
}

export default function TaskActivityFeed({ taskId }: TaskActivityFeedProps) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const visible = expanded ? entries : entries.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Clock size={14} className="text-text-muted" />
          Activity
        </h3>
        {entries.length > 0 && (
          <span className="text-xs text-text-muted">{entries.length} events</span>
        )}
      </div>

      <div className="px-5 py-3">
        {loading ? (
          <p className="text-xs text-text-muted py-4 text-center">Loading…</p>
        ) : entries.length === 0 ? (
          <EmptyState message="No activity recorded yet" className="border-0 shadow-none px-2 py-8" />
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            {visible.map((entry) => (
              <div key={entry.id} className="relative flex gap-3 py-2">
                <div className="z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-bg-secondary border border-border text-text-muted">
                  {ACTION_ICONS[entry.action] ?? <Edit3 size={10} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary leading-snug">
                    <span className="font-medium text-foreground">
                      {entry.user_name ?? 'System'}
                    </span>{' '}
                    {entry.details ?? entry.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {timeAgo(entry.created_at)}
                  </p>
                </div>
              </div>
            ))}

            {entries.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="relative z-10 text-xs font-medium text-text-muted hover:text-foreground transition-colors pl-7 py-1"
              >
                {expanded
                  ? 'Show less'
                  : `Show ${entries.length - 5} more events`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
