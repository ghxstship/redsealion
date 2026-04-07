'use client';

import { useState } from 'react';
import Link from 'next/link';
import FormInput from '@/components/ui/FormInput';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
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

  const filtered = search
    ? advances.filter((a) =>
        a.advance_number.toLowerCase().includes(search.toLowerCase()) ||
        a.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.venue_name?.toLowerCase().includes(search.toLowerCase())
      )
    : advances;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
        {ADVANCE_LIST_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <FormInput
          type="text"
          placeholder="Search advances..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          message={search ? 'No advances match your search.' : 'No advances yet'}
          description={search ? undefined : 'Create your first production advance to get started.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Advance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Event / Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Dates</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((advance) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
