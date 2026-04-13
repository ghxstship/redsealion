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
import { Upload, SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface ClientRow {
  id: string;
  company_name: string;
  industry: string | null;
  tags: string[];
  proposals: number;
  total_value: number;
  last_activity: string;
}

const BASE_COLUMNS = [
  { key: 'company_name', label: 'Company' },
  { key: 'industry', label: 'Industry' },
  { key: 'tags', label: 'Tags' },
  { key: 'proposals', label: 'Proposals' },
  { key: 'total_value', label: 'Total Value' },
  { key: 'last_activity', label: 'Last Activity' },
];

export default function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'clients' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: BASE_COLUMNS,
    activeView,
    onUpdateView: updateView,
  });

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
    const res = await fetch('/api/clients/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Failed to delete clients');
    router.refresh();
  }

  return (
    <>
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="clients" filename="clients-export" entityType="Clients" />
          </div>
        </div>
      </div>

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

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
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
                {isVisible('company_name') && <TableHead className="px-6 py-3"><SortableHeader label="Company" field="company_name" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('industry') && <TableHead className="px-6 py-3"><SortableHeader label="Industry" field="industry" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('tags') && <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Tags</TableHead>}
                {isVisible('proposals') && <TableHead className="px-6 py-3"><SortableHeader label="Proposals" field="proposals" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('total_value') && <TableHead className="px-6 py-3"><SortableHeader label="Total Value" field="total_value" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('last_activity') && <TableHead className="px-6 py-3"><SortableHeader label="Last Activity" field="last_activity" currentSort={sort} onSort={handleSort} /></TableHead>}
                <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.map((client) => (
                <TableRow
                  key={client.id}
                  className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(client.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <TableCell className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected(client.id)}
                      onChange={() => toggle(client.id)}
                      className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                    />
                  </TableCell>
                  {isVisible('company_name') && (
                    <TableCell className="px-6 py-3.5">
                      <Link href={`/app/clients/${client.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {client.company_name}
                      </Link>
                    </TableCell>
                  )}
                  {isVisible('industry') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{client.industry ?? '\u2014'}</TableCell>}
                  {isVisible('tags') && (
                    <TableCell className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {client.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {isVisible('proposals') && <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{client.proposals}</TableCell>}
                  {isVisible('total_value') && <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(client.total_value)}</TableCell>}
                  {isVisible('last_activity') && <TableCell className="px-6 py-3.5 text-right text-sm text-text-muted">{formatDate(client.last_activity)}</TableCell>}
                  <TableCell className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => router.push(`/app/clients/${client.id}`) },
                      { label: 'Edit', onClick: () => router.push(`/app/clients/${client.id}?edit=true`) },
                      { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(client.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No clients match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />

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
