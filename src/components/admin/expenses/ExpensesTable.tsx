'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatLabel, statusColor } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import FormSelect from '@/components/ui/FormSelect';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import ActiveFilterBadge from '@/components/shared/ActiveFilterBadge';
import { Upload } from 'lucide-react';

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  status: string;
}

const statusFilters = ['all', 'pending', 'approved', 'rejected'] as const;

export default function ExpensesTable({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);

  const filtered = useMemo(() => {
    let result = expenses;
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [expenses, statusFilter, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((e) => e.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0);

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/expenses/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  return (
    <>
      {/* Filters + Search + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FormSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusFilters.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All Status' : formatLabel(s)}</option>
            ))}
          </FormSelect>
          <ActiveFilterBadge count={activeFilterCount} onClearAll={() => setStatusFilter('all')} />
        </div>
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." />
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} />
            Import
          </Button>
          <DataExportMenu data={sorted} entityKey="expenses" filename="expenses-export" entityType="Expenses" />
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="expense"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Expenses', message: `Are you sure you want to delete ${count} expense(s)?` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </th>
                <th className="px-6 py-3"><SortableHeader label="Date" field="expense_date" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Category" field="category" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Description" field="description" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Amount" field="amount" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((exp) => (
                <tr key={exp.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(exp.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" checked={isSelected(exp.id)} onChange={() => toggle(exp.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground capitalize">{exp.category}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{exp.description ?? '\u2014'}</td>
                  <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(exp.status)}`}>{formatLabel(exp.status)}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      { label: 'Delete', variant: 'danger', onClick: () => {
                        void fetch(`/api/expenses/${exp.id}`, { method: 'DELETE' }).then(() => router.refresh());
                      }},
                    ]} />
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">No expenses match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Expenses"
        entityKey="expenses"
        apiEndpoint="/api/expenses"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
