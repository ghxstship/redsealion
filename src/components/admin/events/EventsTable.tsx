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
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.event_code?.toLowerCase().includes(q) ||
        e.presenter?.toLowerCase().includes(q),
    );
  }, [events, search]);

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
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search events..." />
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

      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
              </th>
              {isVisible('name') && <th className="px-6 py-3"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('type') && <th className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('status') && <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('starts_at') && <th className="px-6 py-3"><SortableHeader label="Start Date" field="starts_at" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('ends_at') && <th className="px-6 py-3"><SortableHeader label="End Date" field="ends_at" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('event_code') && <th className="px-6 py-3"><SortableHeader label="Code" field="event_code" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('presenter') && <th className="px-6 py-3"><SortableHeader label="Presenter" field="presenter" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('location_count') && <th className="px-6 py-3"><SortableHeader label="Locations" field="location_count" currentSort={sort} onSort={handleSort} /></th>}
              <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((item) => (
              <tr key={item.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(item.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" checked={isSelected(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </td>
                {isVisible('name') && <td className="px-6 py-3.5"><span className="text-sm font-medium text-foreground">{item.name}</span></td>}
                {isVisible('type') && <td className="px-6 py-3.5"><span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">{formatLabel(item.type)}</span></td>}
                {isVisible('status') && <td className="px-6 py-3.5"><StatusBadge status={item.status} colorMap={EVENT_STATUS_COLORS} /></td>}
                {isVisible('starts_at') && <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(item.starts_at)}</td>}
                {isVisible('ends_at') && <td className="px-6 py-3.5 text-sm text-text-secondary">{formatDate(item.ends_at)}</td>}
                {isVisible('event_code') && <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{item.event_code ?? '\u2014'}</td>}
                {isVisible('presenter') && <td className="px-6 py-3.5 text-sm text-text-secondary">{item.presenter ?? '\u2014'}</td>}
                {isVisible('location_count') && <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.location_count}</td>}
                <td className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(item.id) },
                  ]} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-text-muted">No events match your search.</td></tr>
            )}
          </tbody>
        </table>
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
