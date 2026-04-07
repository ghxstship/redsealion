import { useState, useEffect, useMemo, useCallback } from 'react';
import type { SavedView } from '@/hooks/useEntityViews';

export interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
  pinned: boolean;
}

interface UseStoredColumnConfigOptions {
  baseColumns: Omit<ColumnDef, 'visible' | 'pinned'>[];
  activeView: SavedView | null;
  onUpdateView?: (id: string, updates: Partial<SavedView>) => void;
}

export function useStoredColumnConfig({
  baseColumns,
  activeView,
  onUpdateView,
}: UseStoredColumnConfigOptions) {
  const [localColumns, setLocalColumns] = useState<ColumnDef[]>(() =>
    baseColumns.map(col => ({ ...col, visible: true, pinned: false }))
  );
  
  const [rowHeight, setRowHeight] = useState<'compact' | 'default' | 'tall'>('default');

  // Sync from active view when it changes
  useEffect(() => {
    if (activeView) {
      const config = activeView.config || {};
      const { fieldVisibility, fieldOrder, pinnedColumns, rowHeight: viewRowHeight } = config;
      
      let newColumns = baseColumns.map(col => ({
        ...col,
        visible: fieldVisibility?.[col.key] ?? true,
        pinned: pinnedColumns?.includes(col.key) ?? false,
      }));
      
      // Apply sorting if order exists
      if (fieldOrder && fieldOrder.length > 0) {
        newColumns.sort((a, b) => {
          const aIndex = fieldOrder.indexOf(a.key);
          const bIndex = fieldOrder.indexOf(b.key);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
      }
      
      setLocalColumns(newColumns);
      if (viewRowHeight) setRowHeight(viewRowHeight);
    }
  }, [activeView, baseColumns]);

  const handleColumnsChange = useCallback(
    (newColumns: ColumnDef[]) => {
      setLocalColumns(newColumns);
      
      if (activeView && onUpdateView) {
        const fieldVisibility: Record<string, boolean> = {};
        const fieldOrder: string[] = [];
        const pinnedColumns: string[] = [];
        
        newColumns.forEach(c => {
          fieldVisibility[c.key] = c.visible;
          fieldOrder.push(c.key);
          if (c.pinned) pinnedColumns.push(c.key);
        });
        
        onUpdateView(activeView.id, {
          config: {
            ...activeView.config,
            fieldVisibility,
            fieldOrder,
            pinnedColumns,
          }
        });
      }
    },
    [activeView, onUpdateView]
  );
  
  const handleRowHeightChange = useCallback(
    (height: 'compact' | 'default' | 'tall') => {
      setRowHeight(height);
      if (activeView && onUpdateView) {
        onUpdateView(activeView.id, {
          config: {
            ...activeView.config,
            rowHeight: height,
          }
        });
      }
    },
    [activeView, onUpdateView]
  );

  const visibleColumns = useMemo(() => localColumns.filter(c => c.visible), [localColumns]);
  const isVisible = useCallback((key: string) => localColumns.find(c => c.key === key)?.visible ?? false, [localColumns]);

  return {
    columns: localColumns,
    visibleColumns,
    isVisible,
    rowHeight,
    setColumns: handleColumnsChange,
    setRowHeight: handleRowHeightChange,
  };
}
