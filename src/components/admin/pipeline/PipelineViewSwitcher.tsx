'use client';

import { useState } from 'react';
import PipelineBoard from './PipelineBoard';
import PipelineTable from './PipelineTable';
import type { Deal } from '@/types/database';

type DealWithClient = Deal & { client_name: string };

const views = [
  { key: 'board', label: 'Board', icon: 'M2 3h20v18H2V3zM8 3v18M15 3v18' },
  { key: 'table', label: 'Table', icon: 'M3 4h18v16H3V4zM3 8h18M3 12h18M3 16h18M9 4v16' },
] as const;

type ViewType = typeof views[number]['key'];

export default function PipelineViewSwitcher({ deals }: { deals: DealWithClient[] }) {
  const [view, setView] = useState<ViewType>('board');

  const tableDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    client_name: d.client_name,
    value: d.deal_value,
    stage: d.stage,
    probability: d.probability ?? 0,
    expected_close: d.expected_close_date ?? null,
    owner_name: null,
  }));

  return (
    <>
      {/* View toggle */}
      <div className="mb-6 flex items-center gap-1 rounded-lg border border-border bg-bg-secondary p-1 w-fit">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v.key ? 'bg-white text-foreground shadow-sm' : 'text-text-muted hover:text-foreground'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={v.icon} />
            </svg>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'board' ? (
        <PipelineBoard initialDeals={deals} />
      ) : (
        <PipelineTable deals={tableDeals} />
      )}
    </>
  );
}
