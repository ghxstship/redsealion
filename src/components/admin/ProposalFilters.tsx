'use client';

import { useState, useCallback } from 'react';
import type { ProposalStatus } from '@/types/database';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';

export interface FilterValues {
  status: ProposalStatus | 'all';
  search: string;
  sort: 'date' | 'value' | 'name';
}

interface ProposalFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: Partial<FilterValues>;
}

const statusOptions: { value: ProposalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_production', label: 'In Production' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortOptions: { value: FilterValues['sort']; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'value', label: 'Value' },
  { value: 'name', label: 'Name' },
];

export default function ProposalFilters({
  onFilterChange,
  initialFilters,
}: ProposalFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    status: initialFilters?.status ?? 'all',
    search: initialFilters?.search ?? '',
    sort: initialFilters?.sort ?? 'date',
  });

  const update = useCallback(
    (patch: Partial<FilterValues>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        onFilterChange(next);
        return next;
      });
    },
    [onFilterChange],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7" cy="7" r="5" />
          <path d="M14 14l-3.5-3.5" />
        </svg>
        <FormInput
          type="text"
          placeholder="Search proposals..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })} />
      </div>

      {/* Status dropdown */}
      <FormSelect
        value={filters.status}
        onChange={(e) =>
          update({ status: e.target.value as FilterValues['status'] })
        }
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </FormSelect>

      {/* Sort dropdown */}
      <FormSelect
        value={filters.sort}
        onChange={(e) =>
          update({ sort: e.target.value as FilterValues['sort'] })
        }
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Sort: {opt.label}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
