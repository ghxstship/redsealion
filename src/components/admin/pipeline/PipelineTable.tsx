'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { formatLabel, formatCurrency } from '@/lib/utils';
import StatusBadge, { PIPELINE_STAGE_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';

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





export default function PipelineTable({ deals }: { deals: Deal[] }) {
  const router = useRouter();
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search deals..." />
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
              <th className="px-6 py-3 w-12"><span className="sr-only">Actions</span></th>
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
                  <StatusBadge status={deal.stage} colorMap={PIPELINE_STAGE_COLORS} />
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">{deal.probability}%</td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {deal.expected_close ? new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">{deal.owner_name ?? '\u2014'}</td>
                <td className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/pipeline/${deal.id}`) },
                  ]} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No deals match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
