'use client';

import { useState, useCallback } from 'react';
import type { ProposalStatus } from '@/types/database';
import FormSelect from '@/components/ui/FormSelect';
import SearchInput from '@/components/ui/SearchInput';
import ActiveFilterBadge from '@/components/shared/ActiveFilterBadge';

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
      <SearchInput
        value={filters.search}
        onChange={(val) => update({ search: val })}
        placeholder="Search proposals..."
      />

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

      {/* Filter Badge */}
      <ActiveFilterBadge
        count={(filters.status !== 'all' ? 1 : 0) + (filters.sort !== 'date' ? 1 : 0)}
        onClearAll={() => update({ status: 'all', sort: 'date', search: '' })}
      />
    </div>
  );
}
