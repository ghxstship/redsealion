'use client';

/**
 * Project status updates — weekly summary posts per project.
 *
 * @module components/admin/tasks/ProjectStatusUpdates
 */

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import FormTextarea from '@/components/ui/FormTextarea';
import FormSelect from '@/components/ui/FormSelect';
import { MessageSquare, Plus } from 'lucide-react';

interface StatusUpdate {
  id: string;
  status: string;
  summary: string;
  author_name: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'on_track', label: 'On Track', color: 'bg-green-100 text-green-700' },
  { value: 'at_risk', label: 'At Risk', color: 'bg-amber-100 text-amber-700' },
  { value: 'off_track', label: 'Off Track', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-700' },
];

interface ProjectStatusUpdatesProps {
  proposalId: string;
}

export default function ProjectStatusUpdates({ proposalId }: ProjectStatusUpdatesProps) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newStatus, setNewStatus] = useState('on_track');
  const [newSummary, setNewSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUpdates = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/status-updates`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(data.updates ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  async function handleSubmit() {
    if (!newSummary.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/status-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, summary: newSummary }),
      });
      if (res.ok) {
        setNewSummary('');
        setNewStatus('on_track');
        setShowAdd(false);
        await fetchUpdates();
      }
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MessageSquare size={14} className="text-text-muted" />
          Status Updates
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Post Update
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-3">
          <FormSelect value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormSelect>
          <FormTextarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            rows={3}
            placeholder="What's the latest on this project?"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={!newSummary.trim()}>
              Post
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {loading ? (
          <div className="px-5 py-6 text-center text-xs text-text-muted">Loading…</div>
        ) : updates.length === 0 ? (
          <EmptyState message="No status updates yet" className="border-0 shadow-none px-2 py-8" />
        ) : (
          updates.map((update) => {
            const opt = STATUS_OPTIONS.find((o) => o.value === update.status);
            return (
              <div key={update.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${opt?.color ?? 'bg-bg-secondary text-gray-600'}`}>
                    {opt?.label ?? update.status}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {update.author_name ?? 'Unknown'} · {timeAgo(update.created_at)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{update.summary}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
