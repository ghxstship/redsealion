'use client';

/**
 * Task checklist — lightweight inline sub-items within a task.
 *
 * Unlike subtasks (which are full task entities), checklist items are
 * simple text + done state stored via the task API.
 *
 * @module components/admin/tasks/TaskChecklist
 */

import { useCallback, useEffect, useState } from 'react';
import FormInput from '@/components/ui/FormInput';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface TaskChecklistProps {
  taskId: string;
}

export default function TaskChecklist({ taskId }: TaskChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');

  /* ── Fetch ───────────────────────────────────────────────── */

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* ── Add item ────────────────────────────────────────────── */

  async function handleAdd() {
    const text = newText.trim();
    if (!text) return;

    // Optimistic add
    const tempId = `temp-${Date.now()}`;
    setItems((prev) => [...prev, { id: tempId, text, done: false }]);
    setNewText('');

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        await fetchItems();
      }
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== tempId));
    }
  }

  /* ── Toggle ──────────────────────────────────────────────── */

  async function handleToggle(item: ChecklistItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
    );

    try {
      await fetch(`/api/tasks/${taskId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !item.done }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)),
      );
    }
  }

  /* ── Delete ──────────────────────────────────────────────── */

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch(`/api/tasks/${taskId}/checklist/${id}`, {
        method: 'DELETE',
      });
    } catch {
      await fetchItems();
    }
  }

  /* ── Render ──────────────────────────────────────────────── */

  const doneCount = items.filter((i) => i.done).length;
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Checklist
          {items.length > 0 && (
            <span className="ml-2 text-text-muted font-normal">
              {doneCount}/{items.length}
            </span>
          )}
        </h3>
        {items.length > 0 && (
          <span className="text-xs text-text-muted tabular-nums">{pct}%</span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="px-5 pt-3">
          <div className="h-1 w-full rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="px-5 py-3 space-y-1">
        {loading ? (
          <p className="text-xs text-text-muted py-4 text-center">Loading…</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-lg py-1.5 px-1 -mx-1 hover:bg-bg-secondary/50 transition-colors"
            >
              <GripVertical
                size={12}
                className="text-text-muted/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
              />
              <button
                onClick={() => handleToggle(item)}
                className={`h-4 w-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.done
                    ? 'border-green-500 bg-green-500'
                    : 'border-border hover:border-text-muted'
                }`}
              >
                {item.done && (
                  <svg viewBox="0 0 16 16" fill="white" className="h-3 w-3">
                    <path d="M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0Z" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.done
                    ? 'text-text-muted line-through'
                    : 'text-foreground'
                }`}
              >
                {item.text}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-600 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}

        {/* Add new item */}
        <div className="flex items-center gap-2 pt-1">
          <Plus size={14} className="text-text-muted flex-shrink-0" />
          <FormInput
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Add checklist item…"
            className="!py-1 !text-sm"
          />
        </div>
      </div>
    </div>
  );
}
