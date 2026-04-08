'use client';

/**
 * Task watching / following — subscribe to updates on a task.
 *
 * @module components/admin/tasks/TaskWatchButton
 */

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface TaskWatchButtonProps {
  taskId: string;
}

export default function TaskWatchButton({ taskId }: TaskWatchButtonProps) {
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/watch`);
      if (res.ok) {
        const data = await res.json();
        setWatching(data.watching ?? false);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function toggle() {
    const newState = !watching;
    setWatching(newState);

    try {
      await fetch(`/api/tasks/${taskId}/watch`, {
        method: newState ? 'POST' : 'DELETE',
      });
    } catch {
      setWatching(!newState); // revert
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        watching
          ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'border-border bg-background text-text-secondary hover:bg-bg-secondary'
      }`}
      title={watching ? 'Stop watching' : 'Watch for updates'}
    >
      {watching ? <EyeOff size={13} /> : <Eye size={13} />}
      {watching ? 'Watching' : 'Watch'}
    </button>
  );
}
