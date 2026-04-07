'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import SearchInput from '@/components/ui/SearchInput';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import FilterPills from '@/components/ui/FilterPills';
import Button from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import { ADVANCE_STATUS_COLORS, ADVANCE_PRIORITY_COLORS, ADVANCE_MODE_COLORS } from './AdvanceStatusBadge';
import { ADVANCE_LIST_TABS, ADVANCE_TYPE_CONFIG } from '@/lib/advances/constants';
import { formatCents, formatAdvanceDate } from '@/lib/advances/utils';
import type { AdvanceStatus, AdvanceMode, AdvanceType, AdvancePriority } from '@/types/database';

interface AdvanceListItem {
  id: string;
  advance_number: string;
  advance_mode: AdvanceMode;
  advance_type: AdvanceType;
  status: AdvanceStatus;
  priority: AdvancePriority;
  event_name: string | null;
  venue_name: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  total_cents: number;
  line_item_count: number;
  submission_deadline: string | null;
  created_at: string;
  projects?: { name: string } | null;
}

interface AdvanceListTableProps {
  advances: AdvanceListItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdvanceListTable({ advances, activeTab, onTabChange }: AdvanceListTableProps) {
  const [search, setSearch] = useState('');
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
  } = useEntityViews({ entityType: 'advances' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'advance_number', label: 'Advance' },
      { key: 'advance_type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'event_name', label: 'Event / Project' },
      { key: 'service_start_date', label: 'Dates' },
      { key: 'line_item_count', label: 'Items' },
      { key: 'total_cents', label: 'Total' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    if (!search) return advances;
    const q = search.toLowerCase();
    return advances.filter((a) =>
      a.advance_number.toLowerCase().includes(q) ||
      a.event_name?.toLowerCase().includes(q) ||
      a.venue_name?.toLowerCase().includes(q)
    );
  }, [advances, search]);

  const { sorted, sort, handleSort } = useSort(filtered);

  return (
    <div>
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search advances..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <FilterPills
            items={ADVANCE_LIST_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            activeKey={activeTab}
            onChange={onTabChange}
          />
        </div>
      </div>

      {/* Table or empty state */}
      {sorted.length === 0 ? (
        <EmptyState
          message={search ? 'No advances match your search.' : 'No advances yet'}
          description={search ? undefined : 'Create your first production advance to get started.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                {isVisible('advance_number') && <th className="px-4 py-3"><SortableHeader label="Advance" field="advance_number" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('advance_type') && <th className="px-4 py-3"><SortableHeader label="Type" field="advance_type" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('status') && <th className="px-4 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('priority') && <th className="px-4 py-3"><SortableHeader label="Priority" field="priority" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('event_name') && <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Event / Project</th>}
                {isVisible('service_start_date') && <th className="px-4 py-3"><SortableHeader label="Dates" field="service_start_date" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('line_item_count') && <th className="px-4 py-3"><SortableHeader label="Items" field="line_item_count" currentSort={sort} onSort={handleSort} /></th>}
                {isVisible('total_cents') && <th className="px-4 py-3"><SortableHeader label="Total" field="total_cents" currentSort={sort} onSort={handleSort} /></th>}
                <th className="px-4 py-3 w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((advance) => (
                <tr key={advance.id} className="transition-colors hover:bg-bg-secondary/30">
                  {isVisible('advance_number') && (
                    <td className="px-4 py-3">
                      <Link href={`/app/advancing/${advance.id}`} className="group flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {advance.advance_number}
                        </span>
                        <StatusBadge status={advance.advance_mode} colorMap={ADVANCE_MODE_COLORS} className="mt-0.5 w-fit" />
                      </Link>
                    </td>
                  )}
                  {isVisible('advance_type') && (
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {ADVANCE_TYPE_CONFIG[advance.advance_type]?.label ?? advance.advance_type}
                    </td>
                  )}
                  {isVisible('status') && (
                    <td className="px-4 py-3">
                      <StatusBadge status={advance.status} colorMap={ADVANCE_STATUS_COLORS} />
                    </td>
                  )}
                  {isVisible('priority') && (
                    <td className="px-4 py-3">
                      <StatusBadge status={advance.priority} colorMap={ADVANCE_PRIORITY_COLORS} />
                    </td>
                  )}
                  {isVisible('event_name') && (
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {advance.event_name ?? advance.projects?.name ?? '—'}
                    </td>
                  )}
                  {isVisible('service_start_date') && (
                    <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                      {formatAdvanceDate(advance.service_start_date)}
                      {advance.service_end_date && ` — ${formatAdvanceDate(advance.service_end_date)}`}
                    </td>
                  )}
                  {isVisible('line_item_count') && (
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                      {advance.line_item_count}
                    </td>
                  )}
                  {isVisible('total_cents') && (
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                      {advance.total_cents > 0 ? formatCents(advance.total_cents) : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => { /* navigation handled by link */ } },
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </div>
  );
}
