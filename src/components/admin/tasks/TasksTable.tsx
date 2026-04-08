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
import RowActionMenu from '@/components/shared/RowActionMenu';
import ActiveFilterBadge from '@/components/shared/ActiveFilterBadge';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload, SlidersHorizontal } from 'lucide-react';
import FilterPills from '@/components/ui/FilterPills';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import InlineEditCell from '@/components/shared/InlineEditCell';



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
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'tasks' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assigneeName', label: 'Assignee' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'subtaskCount', label: 'Subtasks' },
    ],
    activeView,
    onUpdateView: updateView,
  });

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
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Views & Main Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ViewBar
            views={views}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onCreateView={(opts) => createView({
              name: opts.name,
              display_type: opts.display_type,
              config: opts.inherit ? activeView?.config : {}
            })}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
          />
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="tasks" filename="tasks-export" entityType="Tasks" />
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <div className="flex items-center gap-4">
            <FilterPills
              items={statusOptions.map((key) => ({
                key,
                label: key === 'all' ? 'All Status' : formatLabel(key),
                count: key === 'all' ? tasks.length : tasks.filter((t) => t.status === key).length,
              }))}
              activeKey={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
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
              <ActiveFilterBadge
                count={(statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0)}
                onClearAll={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearch(''); }}
              />
            </div>
          </div>
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
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
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
              {isVisible('title') && <th className="px-6 py-3"><SortableHeader label="Task" field="title" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('status') && <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('priority') && <th className="px-6 py-3"><SortableHeader label="Priority" field="priority" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('assigneeName') && <th className="px-6 py-3"><SortableHeader label="Assignee" field="assigneeName" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('dueDate') && <th className="px-6 py-3"><SortableHeader label="Due Date" field="dueDate" currentSort={sort} onSort={handleSort} /></th>}
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
                {isVisible('title') && (
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
                )}
                {isVisible('status') && (
                  <td className="px-6 py-3.5">
                    <InlineEditCell
                      type="select"
                      value={task.status}
                      options={statusOptions}
                      onSave={(val) => patchTask(task.id, { status: val })}
                      renderValue={(v) => <StatusBadge status={v} colorMap={TASK_STATUS_COLORS} />}
                    />
                  </td>
                )}
                {isVisible('priority') && (
                  <td className="px-6 py-3.5">
                    <InlineEditCell
                      type="select"
                      value={task.priority}
                      options={priorityOptions}
                      onSave={(val) => patchTask(task.id, { priority: val })}
                      renderValue={(v) => <StatusBadge status={v} colorMap={TASK_PRIORITY_COLORS} />}
                    />
                  </td>
                )}
                {isVisible('assigneeName') && <td className="px-6 py-3.5 text-sm text-text-secondary">{task.assigneeName ?? '\u2014'}</td>}
                {isVisible('dueDate') && (
                  <td className="px-6 py-3.5">
                    <InlineEditCell
                      type="date"
                      value={task.dueDate ?? ''}
                      onSave={(val) => patchTask(task.id, { due_date: val })}
                      renderValue={(v) => {
                        const isOverdue = v && new Date(v + 'T23:59:59') < new Date();
                        return (
                          <span className={isOverdue ? 'text-red-600 font-medium text-sm' : 'text-text-secondary text-sm'}>
                            {v ? new Date(v + 'T00:00:00').toLocaleDateString() : '\u2014'}
                          </span>
                        );
                      }}
                    />
                  </td>
                )}
                <td className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/tasks/${task.id}`) },
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(task.id) },
                  ]} />
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

      {/* Data Import */}
      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Tasks"
        entityKey="tasks"
        apiEndpoint="/api/tasks"
        onComplete={() => router.refresh()}
      />
      
      {/* Column Configuration */}
      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </>
  );
}
