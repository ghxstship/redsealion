'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import ExportButton from '@/components/shared/ExportButton';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import ImportDialog from '@/components/shared/ImportDialog';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
  subtaskCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-50 text-blue-700',
  review: 'bg-purple-50 text-purple-700',
  done: 'bg-green-50 text-green-700',
  blocked: 'bg-red-50 text-red-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700',
  high: 'bg-orange-50 text-orange-700',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const EXPORT_COLUMNS = [
  { key: 'title' as const, label: 'Title' },
  { key: 'status' as const, label: 'Status' },
  { key: 'priority' as const, label: 'Priority' },
  { key: 'assigneeName' as const, label: 'Assignee' },
  { key: 'dueDate' as const, label: 'Due Date' },
];

const statusOptions = ['all', 'not_started', 'in_progress', 'review', 'done', 'blocked'] as const;
const priorityOptions = ['all', 'urgent', 'high', 'medium', 'low'] as const;

const IMPORT_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'description', label: 'Description' },
  { key: 'due_date', label: 'Due Date' },
];

export default function TasksTable({ tasks }: { tasks: TaskRow[] }) {
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
    window.location.reload();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: 'DELETE' })));
    window.location.reload();
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
    window.location.reload();
  }

  return (
    <>
      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Status' : formatLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Priority' : formatLabel(p)}
              </option>
            ))}
          </select>
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
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <ExportButton data={sorted} columns={EXPORT_COLUMNS} filename="tasks-export" />
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
                  className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
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
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
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
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {formatLabel(task.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                    {formatLabel(task.priority)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{task.assigneeName ?? '\u2014'}</td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '\u2014'}
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

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Tasks"
        targetFields={IMPORT_FIELDS}
        apiEndpoint="/api/tasks"
      />
    </>
  );
}
