'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import DataImportDialog from '@/components/shared/DataImportDialog';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';

/* ──────────────────────────────────────────────────────────────
   Inline edit components
   ────────────────────────────────────────────────────────────── */

function InlineSelect({
  value,
  options,
  onSave,
}: {
  value: string;
  options: readonly string[];
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-left cursor-pointer hover:opacity-70 transition-opacity"
        title="Click to edit"
      >
        <StatusBadge
          status={value}
          colorMap={
            options === statusOptions
              ? TASK_STATUS_COLORS
              : TASK_PRIORITY_COLORS
          }
        />
      </button>
    );
  }

  return (
    <FormSelect
      value={value}
      autoFocus
      onChange={(e) => {
        onSave(e.target.value);
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    >
      {options
        .filter((o) => o !== 'all')
        .map((o) => (
          <option key={o} value={o}>
            {formatLabel(o)}
          </option>
        ))}
    </FormSelect>
  );
}

function InlineDateEdit({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    const isOverdue =
      value && new Date(value + 'T23:59:59') < new Date();
    return (
      <button
        onClick={() => setEditing(true)}
        className={`text-sm cursor-pointer hover:opacity-70 transition-opacity ${
          isOverdue ? 'text-red-600 font-medium' : 'text-text-secondary'
        }`}
        title="Click to edit"
      >
        {value ? new Date(value + 'T00:00:00').toLocaleDateString() : '\u2014'}
      </button>
    );
  }

  return (
    <FormInput
      type="date"
      defaultValue={value ?? ''}
      autoFocus
      onChange={(e) => {
        if (e.target.value) {
          onSave(e.target.value);
        }
        setEditing(false);
      }}
      onBlur={() => setEditing(false)}
    />
  );
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
  subtaskCount: number;
}





const statusOptions = ['all', 'not_started', 'in_progress', 'review', 'done', 'blocked'] as const;
const priorityOptions = ['all', 'urgent', 'high', 'medium', 'low'] as const;

export default function TasksTable({ tasks }: { tasks: TaskRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let result = tasks;
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assigneeName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tasks, statusFilter, priorityFilter, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((t) => t.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  async function handleBulkStatusChange(ids: string[], status: string) {
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }),
      ),
    );
    router.refresh();
  }

  // ---------- Inline cell patching ----------
  async function patchTask(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) router.refresh();
  }

  return (
    <>
      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <FormSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : formatLabel(s)}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Priority' : formatLabel(p)}
              </option>
            ))}
          </FormSelect>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || search) && (
            <button
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearch(''); }}
              className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <FormInput
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <DataExportMenu data={sorted} entityKey="tasks" filename="tasks-export" entityType="Tasks" />
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="task"
        actions={[
          {
            label: 'Mark Done',
            onClick: (ids) => handleBulkStatusChange(ids, 'done'),
          },
          {
            label: 'Mark In Progress',
            onClick: (ids) => handleBulkStatusChange(ids, 'in_progress'),
          },
          {
            label: 'Reassign',
            onClick: async (ids) => {
              const assignee = window.prompt('Assign to (enter team member name):');
              if (!assignee) return;
              await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to_name: assignee }),
              })));
              router.refresh();
            },
          },
          {
            label: 'Tag',
            onClick: async (ids) => {
              const tag = window.prompt('Enter tag to apply:');
              if (!tag) return;
              await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags: [tag] }),
              })));
              router.refresh();
            },
          },
          {
            label: 'Delete',
            variant: 'danger',
            confirm: {
              title: 'Delete Tasks',
              message: `Are you sure you want to delete ${count} task(s)? This action cannot be undone.`,
            },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                />
              </th>
              <th className="px-6 py-3"><SortableHeader label="Task" field="title" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Priority" field="priority" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Assignee" field="assigneeName" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Due Date" field="dueDate" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-16">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((task) => (
              <tr
                key={task.id}
                className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(task.id) ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected(task.id)}
                    onChange={() => toggle(task.id)}
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                  />
                </td>
                <td className="px-6 py-3.5">
                  <Link
                    href={`/app/tasks/${task.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.subtaskCount > 0 && (
                    <span className="ml-2 text-xs text-text-muted">
                      {task.subtaskCount} subtask{task.subtaskCount > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <InlineSelect
                    value={task.status}
                    options={statusOptions}
                    onSave={(val) => patchTask(task.id, { status: val })}
                  />
                </td>
                <td className="px-6 py-3.5">
                  <InlineSelect
                    value={task.priority}
                    options={priorityOptions}
                    onSave={(val) => patchTask(task.id, { priority: val })}
                  />
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{task.assigneeName ?? '\u2014'}</td>
                <td className="px-6 py-3.5">
                  <InlineDateEdit
                    value={task.dueDate}
                    onSave={(val) => patchTask(task.id, { due_date: val })}
                  />
                </td>
                <td className="px-6 py-3.5">
                  <button
                    onClick={() => setShowDeleteConfirm(task.id)}
                    className="text-text-muted hover:text-red-600 transition-colors"
                    title="Delete task"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Single delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Tasks"
        entityKey="tasks"
        apiEndpoint="/api/tasks"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
