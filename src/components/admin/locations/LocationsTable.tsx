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
import StatusBadge, { LOCATION_TYPE_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';

export interface LocationItem {
  id: string;
  name: string;
  type: string;
  formatted_address: string | null;
  phone: string | null;
  capacity: number | null;
  timezone: string | null;
  google_place_id: string | null;
  status: string;
}

export default function LocationsTable({ locations }: { locations: LocationItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views, activeView, activeViewId, setActiveViewId,
    createView, updateView, deleteView, duplicateView,
  } = useEntityViews({ entityType: 'locations' });

  const {
    columns, isVisible, rowHeight, setColumns, setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'formatted_address', label: 'Address' },
      { key: 'phone', label: 'Phone' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'timezone', label: 'Timezone' },
      { key: 'google_place_id', label: 'Maps' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.formatted_address?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q),
    );
  }, [locations, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((l) => l.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/locations/${id}`, { method: 'DELETE' })));
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search locations..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <DataExportMenu data={sorted} entityKey="locations" filename="locations-export" entityType="Locations" />
          </div>
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="location"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Locations', message: `Delete ${count} location(s)? Activations at these locations will lose their location reference.` },
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
              {isVisible('formatted_address') && <th className="px-6 py-3"><SortableHeader label="Address" field="formatted_address" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('phone') && <th className="px-6 py-3"><SortableHeader label="Phone" field="phone" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('capacity') && <th className="px-6 py-3"><SortableHeader label="Capacity" field="capacity" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('timezone') && <th className="px-6 py-3"><SortableHeader label="Timezone" field="timezone" currentSort={sort} onSort={handleSort} /></th>}
              {isVisible('google_place_id') && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Maps</th>}
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
                {isVisible('type') && <td className="px-6 py-3.5"><StatusBadge status={item.type} colorMap={LOCATION_TYPE_COLORS} /></td>}
                {isVisible('formatted_address') && <td className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{item.formatted_address ?? '\u2014'}</td>}
                {isVisible('phone') && <td className="px-6 py-3.5 text-sm text-text-secondary">{item.phone ?? '\u2014'}</td>}
                {isVisible('capacity') && <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.capacity?.toLocaleString() ?? '\u2014'}</td>}
                {isVisible('timezone') && <td className="px-6 py-3.5 text-sm text-text-muted">{item.timezone ?? '\u2014'}</td>}
                {isVisible('google_place_id') && (
                  <td className="px-6 py-3.5 text-sm">
                    {item.google_place_id ? (
                      <a href={`https://www.google.com/maps/place/?q=place_id:${item.google_place_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View Map</a>
                    ) : (
                      <span className="text-text-muted">\u2014</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(item.id) },
                  ]} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-text-muted">No locations match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Location" message="Are you sure? Activations using this location will be blocked from deletion (RESTRICT)." confirmLabel="Delete" variant="danger" onConfirm={() => handleDelete(showDeleteConfirm)} onCancel={() => setShowDeleteConfirm(null)} />
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
