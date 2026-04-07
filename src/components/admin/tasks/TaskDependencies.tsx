'use client';

/**
 * Task dependency manager — shows and edits blocking/blocked-by relationships.
 *
 * Fetches from /api/tasks/[id]/dependencies and allows adding/removing deps.
 *
 * @module components/admin/tasks/TaskDependencies
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import StatusBadge, { TASK_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { X, Link2, Search } from 'lucide-react';

interface DepTask {
  id: string;
  title: string;
  status: string;
}

interface SearchResult {
  id: string;
  title: string;
  status: string;
}

interface TaskDependenciesProps {
  taskId: string;
}

export default function TaskDependencies({ taskId }: TaskDependenciesProps) {
  const [blockedBy, setBlockedBy] = useState<DepTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  /* ── Fetch dependencies ──────────────────────────────────── */

  const fetchDeps = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (!res.ok) return;
      const data = await res.json();
      // Map from API format
      const deps = (data.dependencies ?? []).map(
        (d: Record<string, unknown>) => {
          const dep = d.depends_on as DepTask | null;
          return {
            id: (d.depends_on_task_id as string) ?? dep?.id ?? '',
            title: dep?.title ?? 'Unknown',
            status: dep?.status ?? 'unknown',
            depId: d.id as string, // dependency row ID for deletion
          };
        },
      );
      setBlockedBy(deps);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchDeps();
  }, [fetchDeps]);

  /* ── Search for tasks to add ─────────────────────────────── */

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/tasks?search=${encodeURIComponent(searchQuery)}&limit=10`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const tasks = (data.tasks ?? data ?? []) as SearchResult[];
        // Filter out current task and already-added deps
        const existingIds = new Set([
          taskId,
          ...blockedBy.map((d) => d.id),
        ]);
        setSearchResults(tasks.filter((t) => !existingIds.has(t.id)));
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, taskId, blockedBy]);

  /* ── Add dependency ──────────────────────────────────────── */

  async function handleAdd(depTaskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depends_on_task_id: depTaskId }),
      });

      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        await fetchDeps();
      }
    } catch {
      // silent
    }
  }

  /* ── Remove dependency ───────────────────────────────────── */

  async function handleRemove(depTask: DepTask & { depId?: string }) {
    const depId = depTask.depId;
    if (!depId) return;

    try {
      const res = await fetch(
        `/api/tasks/${taskId}/dependencies?dependency_id=${depId}`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setBlockedBy((prev) => prev.filter((d) => d.id !== depTask.id));
      }
    } catch {
      // silent
    }
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Link2 size={14} className="text-text-muted" />
          Dependencies
          {blockedBy.length > 0 && (
            <span className="text-text-muted font-normal">
              ({blockedBy.length})
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add dependency search */}
      {showAdd && (
        <div className="rounded-lg border border-border bg-bg-secondary/30 p-3 space-y-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <FormInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks to add as dependency..."
              autoFocus
              className="pl-8"
            />
          </div>
          {searching && (
            <p className="text-xs text-text-muted px-1">Searching…</p>
          )}
          {searchResults.length > 0 && (
            <div className="rounded-lg border border-border bg-white divide-y divide-border max-h-48 overflow-y-auto">
              {searchResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleAdd(task.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-secondary transition-colors"
                >
                  <StatusBadge
                    status={task.status}
                    colorMap={TASK_STATUS_COLORS}
                  />
                  <span className="flex-1 truncate text-foreground">
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 &&
            !searching &&
            searchResults.length === 0 && (
              <p className="text-xs text-text-muted px-1">
                No matching tasks found.
              </p>
            )}
        </div>
      )}

      {/* Dependency list */}
      {loading ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/30 px-4 py-4 text-center">
          <p className="text-xs text-text-muted">Loading dependencies…</p>
        </div>
      ) : blockedBy.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/30 px-4 py-4 text-center">
          <p className="text-xs text-text-muted">
            No dependencies. This task can start anytime.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-white divide-y divide-border overflow-hidden">
          {blockedBy.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center gap-2 px-3 py-2.5 group"
            >
              <StatusBadge
                status={dep.status}
                colorMap={TASK_STATUS_COLORS}
              />
              <Link
                href={`/app/tasks/${dep.id}`}
                className="flex-1 text-sm text-foreground hover:underline truncate"
              >
                {dep.title}
              </Link>
              <button
                onClick={() =>
                  handleRemove(dep as DepTask & { depId?: string })
                }
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-600 transition-all"
                title="Remove dependency"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
