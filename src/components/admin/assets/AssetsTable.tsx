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

const statusFilters = ['all', 'deployed', 'in_storage', 'in_production', 'in_transit', 'planned'] as const;



export default function AssetsTable({ assets }: { assets: AssetRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

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

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <>
      {/* Status filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                statusFilter === f
                  ? 'bg-foreground text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {f === 'all' ? 'All' : formatStatus(f)}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button onClick={() => { setStatusFilter('all'); setSearch(''); }} className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
              Clear filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <DataExportMenu data={sorted} entityKey="assets" filename="assets-export" entityType="Assets" />
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="asset"
        actions={[
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
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No assets match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3"><SortableHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Condition" field="condition" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Location" field="location_name" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3"><SortableHeader label="Value" field="current_value" currentSort={sort} onSort={handleSort} /></th>
                  <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((asset) => (
                  <tr key={asset.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(asset.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSelected(asset.id)} onChange={() => toggle(asset.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20" />
                    </td>
                    <td className="px-6 py-3.5">
                      <Link href={`/app/assets/${asset.id}`} className="text-sm font-medium text-foreground hover:underline">{asset.name}</Link>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.type}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(asset.status)}`}>{formatStatus(asset.status)}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-medium capitalize ${conditionColors[asset.condition] ?? 'text-text-muted'}`}>{asset.condition}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{asset.location_name ?? '\u2014'}</td>
                    <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(asset.current_value ?? 0)}</td>
                    <td className="px-6 py-3.5">
                      <button onClick={() => setShowDeleteConfirm(asset.id)} className="text-text-muted hover:text-red-600 transition-colors" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title="Delete Asset"
          message="Are you sure you want to delete this asset? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Assets"
        entityKey="assets"
        apiEndpoint="/api/assets"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
