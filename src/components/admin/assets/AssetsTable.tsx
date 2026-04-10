'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, statusColor } from '@/lib/utils';
import { useSort } from '@/hooks/useSort';
import { useSelection } from '@/hooks/useSelection';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import BulkActionBar from '@/components/shared/BulkActionBar';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ActiveFilterBadge from '@/components/shared/ActiveFilterBadge';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import FilterPills from '@/components/ui/FilterPills';
import { Upload, SlidersHorizontal, Plus } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import AssetFormModal from '@/components/admin/assets/AssetFormModal';

interface AssetRow {
  id: string;
  name: string;
  type: string;
  status: string;
  condition: string;
  location_name: string | null;
  proposal_name: string | null;
  current_value: number | null;
}

function formatStatus(status: string): string {
  return status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const conditionColors: Record<string, string> = {
  new: 'text-green-700', excellent: 'text-green-600', good: 'text-blue-600',
  fair: 'text-amber-600', poor: 'text-red-600', damaged: 'text-red-700',
};

const statusFilters = ['all', 'deployed', 'in_storage', 'in_production', 'in_transit', 'planned', 'retired', 'disposed'] as const;

export default function AssetsTable({ assets }: { assets: AssetRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAssetData, setEditAssetData] = useState<Record<string, unknown> | null>(null);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'assets' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'condition', label: 'Condition' },
      { key: 'location_name', label: 'Location' },
      { key: 'current_value', label: 'Value' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    let result = assets;
    if (statusFilter !== 'all') result = result.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }
    return result;
  }, [assets, statusFilter, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((a) => a.id), [sorted]);
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

  const activeFilterCount = statusFilter !== 'all' ? 1 : 0;

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
            <SearchInput value={search} onChange={setSearch} placeholder="Search assets..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="assets" filename="assets-export" entityType="Assets" />
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              New Asset
            </Button>
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <FilterPills
            items={statusFilters.map((f) => ({
              key: f,
              label: f === 'all' ? 'All' : formatStatus(f),
              count: f === 'all' ? assets.length : assets.filter((a) => a.status === f).length,
            }))}
            activeKey={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="asset"
        actions={[
          {
            label: 'Move to Storage',
            variant: 'secondary',
            confirm: { title: 'Move to Storage', message: `Move ${count} asset(s) to "In Storage" status?` },
            onClick: async (ids: string[]) => {
              await Promise.all(ids.map((id) => fetch(`/api/assets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'in_storage' }) })));
              router.refresh();
            },
          },
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Assets', message: `Are you sure you want to delete ${count} asset(s)?` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No assets match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </th>
                  {isVisible('name') && <th className="px-6 py-3"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></th>}
                  {isVisible('type') && <th className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></th>}
                  {isVisible('status') && <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>}
                  {isVisible('condition') && <th className="px-6 py-3"><SortableHeader label="Condition" field="condition" currentSort={sort} onSort={handleSort} /></th>}
                  {isVisible('location_name') && <th className="px-6 py-3"><SortableHeader label="Location" field="location_name" currentSort={sort} onSort={handleSort} /></th>}
                  {isVisible('current_value') && <th className="px-6 py-3"><SortableHeader label="Value" field="current_value" currentSort={sort} onSort={handleSort} /></th>}
                  <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((asset) => (
                  <tr key={asset.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(asset.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected(asset.id)} onChange={() => toggle(asset.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                    </td>
                    {isVisible('name') && (
                      <td className="px-6 py-3.5">
                        <Link href={`/app/assets/${asset.id}`} className="text-sm font-medium text-foreground hover:underline">{asset.name}</Link>
                      </td>
                    )}
                    {isVisible('type') && <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.type}</td>}
                    {isVisible('status') && (
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(asset.status)}`}>{formatStatus(asset.status)}</span>
                      </td>
                    )}
                    {isVisible('condition') && (
                      <td className="px-6 py-3.5">
                        <span className={`text-sm font-medium capitalize ${conditionColors[asset.condition] ?? 'text-text-muted'}`}>{asset.condition}</span>
                      </td>
                    )}
                    {isVisible('location_name') && <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.location_name ?? '\u2014'}</td>}
                    {isVisible('current_value') && <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(asset.current_value ?? 0)}</td>}
                    <td className="px-6 py-3.5">
                      <RowActionMenu actions={[
                        { label: 'View', onClick: () => router.push(`/app/assets/${asset.id}`) },
                        { label: 'Edit', onClick: () => setEditAssetData({ id: asset.id, name: asset.name, type: asset.type, category: '', status: asset.status }) },
                        { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(asset.id) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Asset" message="Are you sure you want to delete this asset? This action cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={() => handleDelete(showDeleteConfirm)} onCancel={() => setShowDeleteConfirm(null)} />
      )}

      <DataImportDialog open={showImport} onClose={() => setShowImport(false)} entityType="Assets" entityKey="assets" apiEndpoint="/api/assets" onComplete={() => router.refresh()} />

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />

      <AssetFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSaved={() => router.refresh()}
      />

      {editAssetData && (
        <AssetFormModal
          open={!!editAssetData}
          onClose={() => setEditAssetData(null)}
          onSaved={() => { setEditAssetData(null); router.refresh(); }}
          initialData={editAssetData as Record<string, string>}
        />
      )}
    </>
  );
}
