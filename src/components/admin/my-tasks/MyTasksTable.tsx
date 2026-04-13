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
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload, SlidersHorizontal } from 'lucide-react';
import FilterPills from '@/components/ui/FilterPills';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import InlineEditCell from '@/components/shared/InlineEditCell';
import EmptyState from '@/components/ui/EmptyState';
import { CheckCircle2 } from 'lucide-react';
import RowDate from '@/components/ui/RowDate';
import { useTranslation } from '@/lib/i18n/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface MyTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  startDate: string | null;
  startTime: string | null;
  endTime: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  createdBy: string | null;
  projectName: string | null;
  subtaskCount: number;
}

const statusFilterOptions = ['all', 'not_started', 'in_progress', 'review', 'done', 'blocked'] as const;
const priorityFilterOptions = ['all', 'urgent', 'high', 'medium', 'low'] as const;

const statusEditOptions = ['not_started', 'in_progress', 'review', 'done', 'blocked'] as const;
const priorityEditOptions = ['urgent', 'high', 'medium', 'low'] as const;

export default function MyTasksTable({ tasks }: { tasks: MyTaskRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const { t } = useTranslation();

  const {
    views, activeView, activeViewId, setActiveViewId,
    createView, updateView, deleteView, duplicateView,
  } = useEntityViews({ entityType: 'my-tasks' });

  const {
    columns, isVisible, rowHeight, setColumns, setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'title', label: t('myTasks.columns.title') },
      { key: 'status', label: t('myTasks.columns.status') },
      { key: 'priority', label: t('myTasks.columns.priority') },
      { key: 'dueDate', label: t('myTasks.columns.dueDate') },
      { key: 'projectName', label: t('myTasks.columns.project') },
      { key: 'startDate', label: 'Start Date' },
      { key: 'timeBlock', label: 'Time Block' },
      { key: 'estimatedHours', label: 'Est. Hours' },
      { key: 'actualHours', label: 'Actual Hours' },
      { key: 'createdBy', label: 'Created By' },
      { key: 'subtaskCount', label: 'Subtasks' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    let result = tasks;
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter((t) => t.priority === priorityFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.projectName?.toLowerCase().includes(q),
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
            <SearchInput value={search} onChange={setSearch} placeholder={t('myTasks.searchPlaceholder')} />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="my-tasks" filename="my-tasks-export" entityType="My Tasks" />
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <div className="flex items-center gap-4">
            <FilterPills
              items={statusFilterOptions.map((key) => ({
                key,
                label: key === 'all' ? 'All Status' : formatLabel(key),
                count: key === 'all' ? tasks.length : tasks.filter((t) => t.status === key).length,
              }))}
              activeKey={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <FormSelect value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                {priorityFilterOptions.map((p) => (
                  <option key={p} value={p}>{p === 'all' ? 'All Priority' : formatLabel(p)}</option>
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
          { label: 'Mark Done', onClick: (ids) => handleBulkStatusChange(ids, 'done') },
          { label: 'Mark In Progress', onClick: (ids) => handleBulkStatusChange(ids, 'in_progress') },
          {
            label: 'Delete', variant: 'danger',
            confirm: { title: 'Delete Tasks', message: `Are you sure you want to delete ${count} task(s)? This action cannot be undone.` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8" />}
          message={t('myTasks.emptyState.title')}
          description={t('myTasks.emptyState.description')}
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                  />
                </TableHead>
                {isVisible('title') && <TableHead className="px-6 py-3"><SortableHeader label="Task" field="title" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('status') && <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('priority') && <TableHead className="px-6 py-3"><SortableHeader label="Priority" field="priority" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('dueDate') && <TableHead className="px-6 py-3"><SortableHeader label="Due Date" field="dueDate" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('projectName') && <TableHead className="px-6 py-3"><SortableHeader label="Project" field="projectName" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('startDate') && <TableHead className="px-6 py-3"><SortableHeader label="Start Date" field="startDate" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('timeBlock') && <TableHead className="px-6 py-3"><span className="text-xs font-medium uppercase tracking-wider text-text-muted">Time Block</span></TableHead>}
                {isVisible('estimatedHours') && <TableHead className="px-6 py-3"><SortableHeader label="Est. Hours" field="estimatedHours" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('actualHours') && <TableHead className="px-6 py-3"><SortableHeader label="Actual Hours" field="actualHours" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('createdBy') && <TableHead className="px-6 py-3"><SortableHeader label="Created By" field="createdBy" currentSort={sort} onSort={handleSort} /></TableHead>}
                <TableHead className="px-6 py-3 text-left w-16 text-xs font-medium uppercase tracking-wider text-text-muted"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.map((task) => (
                <TableRow
                  key={task.id}
                  className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(task.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <TableCell className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected(task.id)}
                      onChange={() => toggle(task.id)}
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                    />
                  </TableCell>
                  {isVisible('title') && (
                    <TableCell className="px-6 py-3.5">
                      <Link href={`/app/tasks/${task.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {task.title}
                      </Link>
                      {task.subtaskCount > 0 && (
                        <span className="ml-2 text-xs text-text-muted">
                          {task.subtaskCount} subtask{task.subtaskCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </TableCell>
                  )}
                  {isVisible('status') && (
                    <TableCell className="px-6 py-3.5">
                      <InlineEditCell
                        type="select"
                        value={task.status}
                        options={statusEditOptions as any}
                        onSave={(val) => patchTask(task.id, { status: val })}
                        renderValue={(v) => <StatusBadge status={v} colorMap={TASK_STATUS_COLORS} />}
                      />
                    </TableCell>
                  )}
                  {isVisible('priority') && (
                    <TableCell className="px-6 py-3.5">
                      <InlineEditCell
                        type="select"
                        value={task.priority}
                        options={priorityEditOptions as any}
                        onSave={(val) => patchTask(task.id, { priority: val })}
                        renderValue={(v) => <StatusBadge status={v} colorMap={TASK_PRIORITY_COLORS} />}
                      />
                    </TableCell>
                  )}
                  {isVisible('dueDate') && (
                    <TableCell className="px-6 py-3.5">
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
                    </TableCell>
                  )}
                  {isVisible('projectName') && (
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{task.projectName ?? '\u2014'}</TableCell>
                  )}
                  {isVisible('startDate') && (
                    <TableCell className="px-6 py-3.5">
                      <RowDate date={task.startDate} fallback="\u2014" />
                    </TableCell>
                  )}
                  {isVisible('timeBlock') && (
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                      {task.startTime ? (
                        <span>
                          {task.startTime.substring(0, 5)}
                          {task.endTime ? ` - ${task.endTime.substring(0, 5)}` : ''}
                        </span>
                      ) : '\u2014'}
                    </TableCell>
                  )}
                  {isVisible('estimatedHours') && (
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{task.estimatedHours ?? '\u2014'}</TableCell>
                  )}
                  {isVisible('actualHours') && (
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{task.actualHours ?? '\u2014'}</TableCell>
                  )}
                  {isVisible('createdBy') && (
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{task.createdBy ?? '\u2014'}</TableCell>
                  )}
                  <TableCell className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => router.push(`/app/tasks/${task.id}`) },
                      { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(task.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && tasks.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                    No tasks match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Single delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title={t('myTasks.deleteTask')}
          message={t('myTasks.deleteConfirm')}
          confirmLabel={t('common.delete')}
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
