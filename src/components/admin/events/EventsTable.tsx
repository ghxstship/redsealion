import Checkbox from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSort } from '@/hooks/useSort';
import { useSelection } from '@/hooks/useSelection';
import DataExportMenu from '@/components/shared/DataExportMenu';
import SortableHeader from '@/components/shared/SortableHeader';
import BulkActionBar from '@/components/shared/BulkActionBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { EVENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import FormSelect from '@/components/ui/FormSelect';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface EventItem {
  id: string;
  name: string;
  type: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  event_code: string | null;
  presenter: string | null;
  location_count: number;
}

function formatDate(d: string | null): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventsTable({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views, activeView, activeViewId, setActiveViewId,
    createView, updateView, deleteView, duplicateView,
  } = useEntityViews({ entityType: 'events' });

  const {
    columns, isVisible, rowHeight, setColumns, setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'starts_at', label: 'Start Date' },
      { key: 'ends_at', label: 'End Date' },
      { key: 'event_code', label: 'Code' },
      { key: 'presenter', label: 'Presenter' },
      { key: 'location_count', label: 'Locations' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    let result = events;
    if (statusFilter !== 'all') {
      result = result.filter((e) => e.status === statusFilter);
    }
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.event_code?.toLowerCase().includes(q) ||
        e.presenter?.toLowerCase().includes(q),
    );
  }, [events, search, statusFilter]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((e) => e.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/events/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
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
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
            <FormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="all">All Statuses</option>
              {['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
                <option key={status} value={status}>{formatLabel(status)}</option>
              ))}
            </FormSelect>
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <DataExportMenu data={sorted} entityKey="events" filename="events-export" entityType="Events" />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="event"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Events', message: `Delete ${count} event(s)? This cannot be undone.` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border bg-bg-secondary">
              <TableHead className="px-4 py-3 text-left w-10">
                <Checkbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
              </TableHead>
              {isVisible('name') && <TableHead className="px-6 py-3"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('type') && <TableHead className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('status') && <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('starts_at') && <TableHead className="px-6 py-3"><SortableHeader label="Start Date" field="starts_at" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('ends_at') && <TableHead className="px-6 py-3"><SortableHeader label="End Date" field="ends_at" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('event_code') && <TableHead className="px-6 py-3"><SortableHeader label="Code" field="event_code" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('presenter') && <TableHead className="px-6 py-3"><SortableHeader label="Presenter" field="presenter" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('location_count') && <TableHead className="px-6 py-3"><SortableHeader label="Locations" field="location_count" currentSort={sort} onSort={handleSort} /></TableHead>}
              <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {sorted.map((item) => (
              <TableRow key={item.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(item.id) ? 'bg-blue-50/50' : ''}`}>
                <TableCell className="px-4 py-3.5">
                  <Checkbox checked={isSelected(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </TableCell>
                {isVisible('name') && <TableCell className="px-6 py-3.5"><span className="text-sm font-medium text-foreground">{item.name}</span></TableCell>}
                {isVisible('type') && <TableCell className="px-6 py-3.5"><Badge variant="muted">{formatLabel(item.type)}</Badge></TableCell>}
                {isVisible('status') && <TableCell className="px-6 py-3.5"><StatusBadge status={item.status} colorMap={EVENT_STATUS_COLORS} /></TableCell>}
                {isVisible('starts_at') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(item.starts_at)}</TableCell>}
                {isVisible('ends_at') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(item.ends_at)}</TableCell>}
                {isVisible('event_code') && <TableCell className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{item.event_code ?? '\u2014'}</TableCell>}
                {isVisible('presenter') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{item.presenter ?? '\u2014'}</TableCell>}
                {isVisible('location_count') && <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.location_count}</TableCell>}
                <TableCell className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/events/${item.id}`) },
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(item.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={10} className="px-6 py-12 text-center text-sm text-text-muted">No events match your search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Event" message="Are you sure you want to delete this event? Activations linked to this event will also be deleted." confirmLabel="Delete" variant="danger" onConfirm={() => handleDelete(showDeleteConfirm)} onCancel={() => setShowDeleteConfirm(null)} />
      )}

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
