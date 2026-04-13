'use client';

import { useState, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * Hook for managing sort state across table columns.
 * Click cycles: none → asc → desc → none
 */
export function useSort<T>(data: T[]): {
  sorted: T[];
  sort: SortConfig | null;
  handleSort: (field: string) => void;
  clearSort: () => void;
} {
  const [sort, setSort] = useState<SortConfig | null>(null);

  const handleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: 'asc' };
      if (prev.direction === 'asc') return { field, direction: 'desc' };
      return null; // cycle back to none
    });
  }, []);

  const clearSort = useCallback(() => setSort(null), []);

  const sorted = sort
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sort.field];
        const bv = (b as Record<string, unknown>)[sort.field];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
        return sort.direction === 'desc' ? -cmp : cmp;
      })
    : data;

  return { sorted, sort, handleSort, clearSort };
}
