'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import ExportButton from '@/components/shared/ExportButton';
import SortableHeader from '@/components/shared/SortableHeader';
import ImportDialog from '@/components/shared/ImportDialog';

interface Lead {
  id: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string | null;
  company_name: string | null;
  contact_phone: string | null;
  status: string;
  source: string;
  estimated_budget: number | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-yellow-50 text-yellow-700',
  qualified: 'bg-green-50 text-green-700',
  proposal_sent: 'bg-purple-50 text-purple-700',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-50 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
  disqualified: 'bg-red-50 text-red-700',
};

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusTabs = ['all', 'new', 'contacted', 'qualified'] as const;

const EXPORT_COLUMNS = [
  { key: 'contact_first_name' as const, label: 'First Name' },
  { key: 'contact_last_name' as const, label: 'Last Name' },
  { key: 'contact_email' as const, label: 'Email' },
  { key: 'company_name' as const, label: 'Company' },
  { key: 'source' as const, label: 'Source' },
  { key: 'estimated_budget' as const, label: 'Budget' },
  { key: 'status' as const, label: 'Status' },
  { key: 'created_at' as const, label: 'Date' },
];

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let result = leads;
    if (activeTab !== 'all') {
      result = result.filter((l) => l.status === activeTab);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          `${l.contact_first_name} ${l.contact_last_name}`.toLowerCase().includes(q) ||
          l.company_name?.toLowerCase().includes(q) ||
          l.contact_email?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [leads, activeTab, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((l) => l.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleBulkDelete(ids: string[]) {
    // TODO: Wire to batch delete API when available
    await Promise.all(ids.map((id) => fetch(`/api/leads/${id}`, { method: 'DELETE' })));
    window.location.reload();
  }

  async function handleBulkStatusChange(ids: string[], status: string) {
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }),
      ),
    );
    window.location.reload();
  }

  return (
    <>
      {/* Status tabs + search + export */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-bg-secondary p-1 w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-foreground shadow-sm'
                  : 'bg-transparent text-text-muted hover:text-foreground'
              }`}
            >
              {formatLabel(tab)} ({tab === 'all' ? leads.length : leads.filter((l) => l.status === tab).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
          <button onClick={() => setShowImport(true)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M3 8l4 4 4-4" /></svg>
            Import
          </button>
          <ExportButton data={sorted as unknown as Record<string, unknown>[]} columns={EXPORT_COLUMNS} filename="leads-export" />
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="lead"
        actions={[
          {
            label: 'Mark Contacted',
            onClick: (ids) => handleBulkStatusChange(ids, 'contacted'),
          },
          {
            label: 'Mark Qualified',
            onClick: (ids) => handleBulkStatusChange(ids, 'qualified'),
          },
          {
            label: 'Delete',
            variant: 'danger',
            confirm: {
              title: 'Delete Leads',
              message: `Are you sure you want to delete ${count} lead(s)? This action cannot be undone.`,
            },
            onClick: handleBulkDelete,
          },
        ]}
      />

      {/* Table */}
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
                  className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
                />
              </th>
              <th className="px-6 py-3"><SortableHeader label="Name" field="contact_first_name" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Company" field="company_name" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Contact" field="contact_email" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Source" field="source" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Budget" field="estimated_budget" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Date" field="created_at" currentSort={sort} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((lead) => (
              <tr
                key={lead.id}
                className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(lead.id) ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected(lead.id)}
                    onChange={() => toggle(lead.id)}
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/20"
                  />
                </td>
                <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                  {lead.contact_first_name} {lead.contact_last_name}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {lead.company_name ?? '\u2014'}
                </td>
                <td className="px-6 py-3.5">
                  <div className="text-sm text-text-secondary">{lead.contact_email ?? '\u2014'}</div>
                  {lead.contact_phone && (
                    <div className="text-xs text-text-muted">{lead.contact_phone}</div>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {lead.source}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {lead.estimated_budget != null
                    ? formatCurrency(lead.estimated_budget)
                    : '\u2014'}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(lead.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-muted">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">
                  No leads match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Leads"
        targetFields={[
          { key: 'contact_first_name', label: 'First Name', required: true },
          { key: 'contact_last_name', label: 'Last Name', required: true },
          { key: 'contact_email', label: 'Email' },
          { key: 'company_name', label: 'Company' },
          { key: 'source', label: 'Source' },
          { key: 'estimated_budget', label: 'Budget' },
        ]}
        apiEndpoint="/api/leads"
      />
    </>
  );
}
