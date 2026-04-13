import Checkbox from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSort } from '@/hooks/useSort';
import { useSelection } from '@/hooks/useSelection';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import BulkActionBar from '@/components/shared/BulkActionBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload, SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import EquipmentFormModal from '@/components/admin/equipment/EquipmentFormModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  status: string;
  current_location: string;
  serial_number: string | null;
  reservation_count: number;
}

export default function EquipmentTable({ equipment }: { equipment: EquipmentItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'equipment' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'current_location', label: 'Location' },
      { key: 'serial_number', label: 'Serial #' },
      { key: 'reservation_count', label: 'Reservations' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    if (!search) return equipment;
    const q = search.toLowerCase();
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.serial_number?.toLowerCase().includes(q) ||
        e.current_location.toLowerCase().includes(q),
    );
  }, [equipment, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((e) => e.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/assets/${id}`, { method: 'DELETE' })));
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search equipment..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="equipment" filename="equipment-export" entityType="Equipment" />
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="item"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Equipment', message: `Delete ${count} equipment item(s)? This cannot be undone.` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
              </TableHead>
              {isVisible('name') && <TableHead className="px-6"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('category') && <TableHead className="px-6"><SortableHeader label="Category" field="category" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('status') && <TableHead className="px-6"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('current_location') && <TableHead className="px-6"><SortableHeader label="Location" field="current_location" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('serial_number') && <TableHead className="px-6"><SortableHeader label="Serial #" field="serial_number" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('reservation_count') && <TableHead className="px-6"><SortableHeader label="Reservations" field="reservation_count" currentSort={sort} onSort={handleSort} /></TableHead>}
              <TableHead className="px-6 w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.id} className={isSelected(item.id) ? 'bg-blue-50/50' : ''}>
                <TableCell>
                  <Checkbox checked={isSelected(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </TableCell>
                {isVisible('name') && (
                  <TableCell className="px-6 font-medium text-foreground">
                    <Link href={`/app/equipment/${item.id}`} className="hover:underline">{item.name}</Link>
                  </TableCell>
                )}
                {isVisible('category') && (
                  <TableCell className="px-6">
                    <Badge variant="muted">{item.category}</Badge>
                  </TableCell>
                )}
                {isVisible('status') && (
                  <TableCell className="px-6">
                    <StatusBadge status={item.status} colorMap={EQUIPMENT_STATUS_COLORS} />
                  </TableCell>
                )}
                {isVisible('current_location') && <TableCell className="px-6 text-text-secondary">{item.current_location}</TableCell>}
                {isVisible('serial_number') && <TableCell className="px-6 tabular-nums text-text-muted">{item.serial_number ?? '\u2014'}</TableCell>}
                {isVisible('reservation_count') && <TableCell className="px-6 tabular-nums text-foreground">{item.reservation_count}</TableCell>}
                <TableCell className="px-6">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/equipment/${item.id}`) },
                    { label: 'Edit', onClick: () => setEditItem(item) },
                    { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(item.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={8} className="px-6 py-12 text-center text-text-muted">No equipment matches your search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Equipment" message="Are you sure you want to delete this equipment item? This cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={() => handleDelete(showDeleteConfirm)} onCancel={() => setShowDeleteConfirm(null)} />
      )}

      <DataImportDialog open={showImport} onClose={() => setShowImport(false)} entityType="Equipment" entityKey="equipment" apiEndpoint="/api/assets" onComplete={() => router.refresh()} />

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />

      {editItem && (
        <EquipmentFormModal
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onCreated={() => { setEditItem(null); router.refresh(); }}
          initialData={{
            id: editItem.id,
            name: editItem.name,
            category: editItem.category,
            status: editItem.status,
            current_location: editItem.current_location,
            serial_number: editItem.serial_number,
            notes: null,
          }}
        />
      )}
    </>
  );
}
