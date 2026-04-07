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
import { formatLabel } from '@/lib/utils';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import FormInput from '@/components/ui/FormInput';

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
      {/* Search + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {search && (
            <button onClick={() => setSearch('')} className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">Clear search</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <FormInput
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <DataExportMenu data={sorted} entityKey="equipment" filename="equipment-export" entityType="Equipment" />
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
              <th className="px-6 py-3"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Category" field="category" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Location" field="current_location" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Serial #" field="serial_number" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Reservations" field="reservation_count" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((item) => (
              <tr key={item.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(item.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-4 py-3.5">
                  <input type="checkbox" checked={isSelected(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </td>
                <td className="px-6 py-3.5">
                  <Link href={`/app/equipment/${item.id}`} className="text-sm font-medium text-foreground hover:underline">{item.name}</Link>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">{item.category}</span>
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={item.status} colorMap={EQUIPMENT_STATUS_COLORS} />
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{item.current_location}</td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-text-muted">{item.serial_number ?? '\u2014'}</td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{item.reservation_count}</td>
                <td className="px-6 py-3.5">
                  <button onClick={() => setShowDeleteConfirm(item.id)} className="text-text-muted hover:text-red-600 transition-colors" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" /></svg>
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No equipment matches your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title="Delete Equipment"
          message="Are you sure you want to delete this equipment item? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Equipment"
        entityKey="equipment"
        apiEndpoint="/api/assets"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
