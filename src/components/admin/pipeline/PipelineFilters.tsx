'use client';

import { useState } from 'react';

export interface PipelineFilterValues {
  owner: string;
  minProbability: number;
  maxProbability: number;
  dateFrom: string;
  dateTo: string;
}

interface PipelineFiltersProps {
  onFilterChange: (filters: PipelineFilterValues) => void;
}

export default function PipelineFilters({ onFilterChange }: PipelineFiltersProps) {
  const [filters, setFilters] = useState<PipelineFilterValues>({
    owner: 'all',
    minProbability: 0,
    maxProbability: 100,
    dateFrom: '',
    dateTo: '',
  });

  function update(patch: Partial<PipelineFilterValues>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFilterChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Owner</label>
        <select
          value={filters.owner}
          onChange={(e) => update({ owner: e.target.value })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        >
          <option value="all">All owners</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Min probability</label>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.minProbability}
          onChange={(e) => update({ minProbability: Number(e.target.value) })}
          className="w-20 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Max probability</label>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.maxProbability}
          onChange={(e) => update({ maxProbability: Number(e.target.value) })}
          className="w-20 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">From</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">To</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>
    </div>
  );
}
