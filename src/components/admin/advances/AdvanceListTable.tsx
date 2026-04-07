'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import SearchInput from '@/components/ui/SearchInput';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
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
      {/* Tab bar */}
      <Tabs
        tabs={ADVANCE_LIST_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={onTabChange}
        className="mb-6"
      />

      {/* Search */}
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search advances..." />
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
                <th className="px-4 py-3"><SortableHeader label="Advance" field="advance_number" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Type" field="advance_type" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Priority" field="priority" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Event / Project</th>
                <th className="px-4 py-3"><SortableHeader label="Dates" field="service_start_date" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Items" field="line_item_count" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3"><SortableHeader label="Total" field="total_cents" currentSort={sort} onSort={handleSort} /></th>
                <th className="px-4 py-3 w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((advance) => (
                <tr key={advance.id} className="transition-colors hover:bg-bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link href={`/app/advancing/${advance.id}`} className="group flex flex-col">
                      <span className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                        {advance.advance_number}
                      </span>
                      <StatusBadge status={advance.advance_mode} colorMap={ADVANCE_MODE_COLORS} className="mt-0.5 w-fit" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {ADVANCE_TYPE_CONFIG[advance.advance_type]?.label ?? advance.advance_type}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={advance.status} colorMap={ADVANCE_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={advance.priority} colorMap={ADVANCE_PRIORITY_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {advance.event_name ?? advance.projects?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {formatAdvanceDate(advance.service_start_date)}
                    {advance.service_end_date && ` — ${formatAdvanceDate(advance.service_end_date)}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {advance.line_item_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                    {advance.total_cents > 0 ? formatCents(advance.total_cents) : '—'}
                  </td>
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
    </div>
  );
}
