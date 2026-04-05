'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Generic multi-select hook for bulk actions across entity tables.
 *
 * Usage:
 *  const { selectedIds, isSelected, toggle, selectAll, deselectAll, count } = useSelection(items.map(i => i.id));
 */
export function useSelection<T extends string = string>(allIds: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: T) => selectedIds.has(id),
    [selectedIds],
  );

  const isAllSelected = useMemo(
    () => allIds.length > 0 && allIds.every((id) => selectedIds.has(id)),
    [allIds, selectedIds],
  );

  const isSomeSelected = useMemo(
    () => selectedIds.size > 0 && !isAllSelected,
    [selectedIds, isAllSelected],
  );

  const toggleAll = useCallback(() => {
    if (isAllSelected) deselectAll();
    else selectAll();
  }, [isAllSelected, deselectAll, selectAll]);

  const count = selectedIds.size;

  return {
    selectedIds,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    isSomeSelected,
    toggleAll,
    count,
  };
}
