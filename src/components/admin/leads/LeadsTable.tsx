import { Badge } from '@/components/ui/Badge';
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import SortableHeader from '@/components/shared/SortableHeader';
import DataImportDialog from '@/components/shared/DataImportDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { formatLabel, formatCurrency, formatDate } from '@/lib/utils';
import StatusBadge, { LEAD_STATUS_COLORS } from '@/components/ui/StatusBadge';
import LeadEditModal from './LeadEditModal';
import SearchInput from '@/components/ui/SearchInput';
import FilterPills from '@/components/ui/FilterPills';
import Button from '@/components/ui/Button';
import { scoreBarColor, scoreTierClasses } from '@/lib/leads/lead-scoring';
import { Upload, SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import BulkReassignModal from '@/components/shared/BulkReassignModal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
  message: string | null;
  event_type: string | null;
  event_date: string | null;
  assigned_to: string | null;
  assigned_user_name: string | null;
  converted_to_deal_id: string | null;
  lost_reason: string | null;
  score: number;
  score_tier: string;
  created_at: string;
}

const STATUS_TAB_KEYS = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as const;

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'leads' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company' },
      { key: 'contact', label: 'Contact' },
      { key: 'source', label: 'Source' },
      { key: 'budget', label: 'Budget' },
      { key: 'status', label: 'Status' },
      { key: 'score', label: 'Score' },
      { key: 'date', label: 'Date' },
    ],
    activeView,
    onUpdateView: updateView,
  });

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
    await Promise.all(ids.map((id) => fetch(`/api/leads/${id}`, { method: 'DELETE' })));
    router.refresh();
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
    router.refresh();
  }

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
            <SearchInput value={search} onChange={setSearch} placeholder="Search leads..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="leads" filename="leads-export" entityType="Leads" />
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <FilterPills
            items={STATUS_TAB_KEYS.map((tab) => ({
              key: tab,
              label: formatLabel(tab),
              count: tab === 'all' ? leads.length : leads.filter((l) => l.status === tab).length,
            }))}
            activeKey={activeTab}
            onChange={setActiveTab}
          />
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
            label: 'Reassign',
            onClick: () => setShowReassign(true),
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
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
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
              {isVisible('name') && <TableHead className="px-6 py-3"><SortableHeader label="Name" field="contact_first_name" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('company') && <TableHead className="px-6 py-3"><SortableHeader label="Company" field="company_name" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('contact') && <TableHead className="px-6 py-3"><SortableHeader label="Contact" field="contact_email" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('source') && <TableHead className="px-6 py-3"><SortableHeader label="Source" field="source" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('budget') && <TableHead className="px-6 py-3"><SortableHeader label="Budget" field="estimated_budget" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('status') && <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
              {isVisible('score') && <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Score</TableHead>}
              {isVisible('date') && <TableHead className="px-6 py-3"><SortableHeader label="Date" field="created_at" currentSort={sort} onSort={handleSort} /></TableHead>}
              <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {sorted.map((lead) => (
              <TableRow
                key={lead.id}
                className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(lead.id) ? 'bg-blue-50/50' : ''}`}
              >
                <TableCell className="px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isSelected(lead.id)}
                    onChange={() => toggle(lead.id)}
                    className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
                  />
                </TableCell>
                {isVisible('name') && (
                  <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">
                    {lead.contact_first_name} {lead.contact_last_name}
                  </TableCell>
                )}
                {isVisible('company') && (
                  <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                    {lead.company_name ?? '\u2014'}
                  </TableCell>
                )}
                {isVisible('contact') && (
                  <TableCell className="px-6 py-3.5">
                    <div className="text-sm text-text-secondary">{lead.contact_email ?? '\u2014'}</div>
                    {lead.contact_phone && (
                      <div className="text-xs text-text-muted">{lead.contact_phone}</div>
                    )}
                  </TableCell>
                )}
                {isVisible('source') && (
                  <TableCell className="px-6 py-3.5">
                    <Badge variant="muted">
                      {lead.source}
                    </Badge>
                  </TableCell>
                )}
                {isVisible('budget') && (
                  <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                    {lead.estimated_budget != null
                      ? formatCurrency(lead.estimated_budget)
                      : '\u2014'}
                  </TableCell>
                )}
                {isVisible('status') && (
                  <TableCell className="px-6 py-3.5">
                    <StatusBadge status={lead.status} colorMap={LEAD_STATUS_COLORS} />
                  </TableCell>
                )}
                {isVisible('score') && (
                  <TableCell className="px-6 py-3.5">
                    {(() => {
                      const score = lead.score ?? 0;
                      const tier = (lead.score_tier ?? 'cold') as 'hot' | 'warm' | 'cold';
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${scoreTierClasses(tier)}`}>
                            {score}
                          </span>
                        </div>
                      );
                    })()}
                  </TableCell>
                )}
                {isVisible('date') && (
                  <TableCell className="px-6 py-3.5 text-sm text-text-muted">
                    {formatDate(lead.created_at)}
                  </TableCell>
                )}
                <TableCell className="px-4 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/leads/${lead.id}`) },
                    { label: 'Edit', onClick: () => setEditingLead(lead) },
                    ...(lead.status !== 'converted' ? [{ label: 'Convert to Project', onClick: async () => {
                      const res = await fetch(`/api/leads/${lead.id}/convert`, { method: 'POST' });
                      if (res.ok) router.refresh();
                    }}] : []),
                    { label: 'Delete', variant: 'danger' as const, onClick: () => {
                      void fetch(`/api/leads/${lead.id}`, { method: 'DELETE' }).then(() => router.refresh());
                    }},
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="px-6 py-12 text-center text-sm text-text-muted">
                  No leads match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Leads"
        entityKey="leads"
        apiEndpoint="/api/leads"
        onComplete={() => router.refresh()}
      />

      {/* Lead edit modal */}
      {editingLead && (
        <LeadEditModal
          open={!!editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={() => router.refresh()}
          lead={{ ...editingLead, contact_email: editingLead.contact_email ?? '', contact_phone: editingLead.contact_phone ?? null, message: editingLead.message ?? null, event_type: editingLead.event_type ?? null, event_date: editingLead.event_date ?? null, lost_reason: editingLead.lost_reason ?? null }}
        />
      )}

      {/* Column config */}
      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />

      {/* Bulk Reassign Modal */}
      <BulkReassignModal
        open={showReassign}
        onClose={() => setShowReassign(false)}
        selectedIds={Array.from(selectedIds)}
        entityLabel="lead"
        onConfirm={async (userId) => {
          await Promise.all(
            Array.from(selectedIds).map((id) =>
              fetch(`/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigned_to: userId }),
              }),
            ),
          );
          deselectAll();
          router.refresh();
        }}
      />
    </>
  );
}
