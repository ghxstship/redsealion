import Checkbox from '@/components/ui/Checkbox';
'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import LocationFormModal from './LocationFormModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export interface LocationItem extends Record<string, unknown> {
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
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);

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
      { key: 'status', label: 'Status' },
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
    let result = locations;
    if (typeFilter) {
      result = result.filter(l => l.type === typeFilter);
    }
    if (!search) return result;
    const q = search.toLowerCase();
    return result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q) ||
        l.formatted_address?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q),
    );
  }, [locations, search, typeFilter]);

  const { sorted, sort, handleSort } = useSort(filtered);
  // Reset page when sorted results change significantly
  const totalPages = Math.ceil(sorted.length / limit);
  const pagedItems = sorted.slice((page - 1) * limit, page * limit);
  // Optional bounds check if page got out of sync
  if (page > totalPages && totalPages > 0) setPage(totalPages);

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
            {typeFilter && (
              <Button variant="secondary" size="sm" onClick={() => router.push('/app/events/locations')} title="Clear Type Filter">
                Clear: {formatLabel(typeFilter)}
              </Button>
            )}
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
              {isVisible('formatted_address') && <TableHead className="px-6 py-3"><SortableHeader label="Address" field="formatted_address" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('phone') && <TableHead className="px-6 py-3"><SortableHeader label="Phone" field="phone" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('capacity') && <TableHead className="px-6 py-3"><SortableHeader label="Capacity" field="capacity" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('timezone') && <TableHead className="px-6 py-3"><SortableHeader label="Timezone" field="timezone" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('google_place_id') && <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Maps</TableHead>}
              <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {pagedItems.map((item) => (
              <TableRow key={item.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(item.id) ? 'bg-blue-50/50' : ''}`}>
                <TableCell className="px-4 py-3.5">
                  <Checkbox checked={isSelected(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </TableCell>
                {isVisible('name') && (
                  <TableCell className="px-6 py-3.5">
                    <Link href={`/app/locations/${item.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                )}
                {isVisible('type') && <TableCell className="px-6 py-3.5"><StatusBadge status={item.type} colorMap={LOCATION_TYPE_COLORS} /></TableCell>}
                {isVisible('status') && <TableCell className="px-6 py-3.5"><StatusBadge status={item.status} colorMap={{ active: 'green', archived: 'gray' }} /></TableCell>}
                {isVisible('formatted_address') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary max-w-xs truncate">{item.formatted_address ?? '\u2014'}</TableCell>}
                {isVisible('phone') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{item.phone ?? '\u2014'}</TableCell>}
                {isVisible('capacity') && <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.capacity?.toLocaleString() ?? '\u2014'}</TableCell>}
                {isVisible('timezone') && <TableCell className="px-6 py-3.5 text-sm text-text-muted">{item.timezone ?? '\u2014'}</TableCell>}
                {isVisible('google_place_id') && (
                  <TableCell className="px-6 py-3.5 text-sm">
                    {item.google_place_id ? (
                      <a href={`https://www.google.com/maps/place/?q=place_id:${item.google_place_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">View Map</a>
                    ) : (
                      <span className="text-text-muted">\u2014</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/locations/${item.id}`) },
                    { label: 'Edit', onClick: () => setEditingLocation(item) },
                    item.status === 'archived' 
                      ? { label: 'Unarchive', onClick: async () => { await fetch(`/api/locations/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' })}); router.refresh(); } }
                      : { label: 'Archive', onClick: async () => { await fetch(`/api/locations/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'archived' })}); router.refresh(); } },
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(item.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={9} className="px-6 py-12 text-center text-sm text-text-muted">No locations match your search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-bg-secondary/20">
            <div className="text-sm text-text-secondary">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, sorted.length)} of {sorted.length} locations
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
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
      
      <LocationFormModal 
        open={!!editingLocation} 
        location={editingLocation}
        onClose={() => setEditingLocation(null)}
        onCreated={() => {
          setEditingLocation(null);
          router.refresh();
        }}
      />
    </>
  );
}
