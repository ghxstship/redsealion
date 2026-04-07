'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import DataImportDialog from '@/components/shared/DataImportDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import { Upload } from 'lucide-react';

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  tags: string[];
  proposals: number;
  total_value: number;
  last_activity: string;
}

export default function ClientsSearch({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.company_name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((c) => c.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setShowDeleteConfirm(null);
    router.refresh();
  }

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/clients/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  return (
    <>
      {/* Search + Export row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} />
            Import
          </Button>
          <DataExportMenu data={sorted} entityKey="clients" filename="clients-export" entityType="Clients" />
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="client"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: {
              title: 'Delete Clients',
              message: `Are you sure you want to delete ${count} client(s)? This action cannot be undone.`,
            },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
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
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                  />
                </th>
                <th className="px-6 py-3"><SortableHeader label="Company" field="company_name" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Industry" field="industry" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Tags</th>
                <th className="px-6 py-3"><SortableHeader label="Proposals" field="proposals" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Total Value" field="total_value" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Last Activity" field="last_activity" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((client) => (
                <tr
                  key={client.id}
                  className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(client.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected(client.id)}
                      onChange={() => toggle(client.id)}
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/app/clients/${client.id}`} className="text-sm font-medium text-foreground hover:underline">
                      {client.company_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{client.industry ?? '\u2014'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {client.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm tabular-nums text-foreground">{client.proposals}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(client.total_value)}</td>
                  <td className="px-6 py-4 text-right text-sm text-text-muted">{formatDate(client.last_activity)}</td>
                  <td className="px-6 py-4">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => router.push(`/app/clients/${client.id}`) },
                      { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(client.id) },
                    ]} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No clients match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title="Delete Client"
          message="Are you sure you want to delete this client? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Clients"
        entityKey="clients"
        apiEndpoint="/api/clients"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
