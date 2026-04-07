'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, formatLabel, statusColor } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import FormInput from '@/components/ui/FormInput';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  type: string;
  status: string;
  total: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
}

type Tab = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];





export default function InvoiceTabs({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let result = invoices;
    if (activeTab !== 'all') result = result.filter((inv) => inv.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.client_name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [invoices, activeTab, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((i) => i.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleBulkVoid(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/invoices/${id}/void`, { method: 'POST' })));
    router.refresh();
  }

  async function handleDeleteInvoice(id: string) {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    router.refresh();
  }

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs tabular-nums">
                ({invoices.filter((i) => tab.key === 'all' || i.status === tab.key).length})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FormInput
          type="text"
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <DataExportMenu data={filtered} entityKey="invoices" filename="invoices-export" entityType="Invoices" />
        </div>
      </div>

      {/* Bulk bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="invoice"
        actions={[
          {
            label: 'Void',
            variant: 'danger',
            confirm: { title: 'Void Invoices', message: `Are you sure you want to void ${count} invoice(s)?` },
            onClick: handleBulkVoid,
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
                  <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </th>
                <th className="px-6 py-3"><SortableHeader label="Invoice" field="invoice_number" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Client" field="client_name" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Amount" field="total_amount" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Paid" field="amount_paid" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Due Date" field="due_date" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-16"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((inv) => (
                <tr key={inv.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(inv.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={isSelected(inv.id)} onChange={() => toggle(inv.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/app/invoices/${inv.id}`} className="text-sm font-medium text-foreground hover:underline">{inv.invoice_number}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{inv.client_name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary capitalize">{inv.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(inv.status)}`}>{formatLabel(inv.status)}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(inv.total)}</td>
                  <td className="px-6 py-4 text-right text-sm tabular-nums text-text-secondary">{formatCurrency(inv.amount_paid)}</td>
                  <td className="px-6 py-4 text-right text-sm text-text-muted">{formatDate(inv.due_date)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteId(inv.id)}
                      className="text-text-muted hover:text-red-600 transition-colors"
                      title="Delete invoice"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-sm text-text-muted">No invoices match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <ConfirmDialog
          open
          title="Delete Invoice"
          message="Are you sure you want to delete this invoice? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDeleteInvoice(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Invoices"
        entityKey="invoices"
        apiEndpoint="/api/invoices"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
