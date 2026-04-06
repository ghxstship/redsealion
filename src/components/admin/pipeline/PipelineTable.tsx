'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import { formatLabel, formatCurrency } from '@/lib/utils';

interface Deal {
  id: string;
  title: string;
  client_name: string | null;
  value: number;
  stage: string;
  probability: number;
  expected_close: string | null;
  owner_name: string | null;
}

const STAGE_COLORS: Record<string, string> = {
  discovery: 'bg-blue-50 text-blue-700',
  qualification: 'bg-indigo-50 text-indigo-700',
  proposal: 'bg-purple-50 text-purple-700',
  negotiation: 'bg-amber-50 text-amber-700',
  closed_won: 'bg-green-50 text-green-700',
  closed_lost: 'bg-red-50 text-red-700',
};



export default function PipelineTable({ deals }: { deals: Deal[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.client_name?.toLowerCase().includes(q) ||
        d.owner_name?.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const { sorted, sort, handleSort } = useSort(filtered);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3"><SortableHeader label="Deal" field="title" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Client" field="client_name" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Value" field="value" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Stage" field="stage" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Probability" field="probability" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Expected Close" field="expected_close" currentSort={sort} onSort={handleSort} /></th>
              <th className="px-6 py-3"><SortableHeader label="Owner" field="owner_name" currentSort={sort} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((deal) => (
              <tr key={deal.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5">
                  <Link href={`/app/pipeline/${deal.id}`} className="text-sm font-medium text-foreground hover:underline">{deal.title}</Link>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{deal.client_name ?? '\u2014'}</td>
                <td className="px-6 py-3.5 text-sm font-medium tabular-nums text-foreground">{formatCurrency(deal.value)}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                    {formatLabel(deal.stage)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">{deal.probability}%</td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {deal.expected_close ? new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{deal.owner_name ?? '\u2014'}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">No deals match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
