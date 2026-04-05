'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SavedView {
  id: string;
  entity_type: string;
  display_type: string;
  name: string;
  description: string | null;
  icon: string | null;
  config: ViewConfig;
  collaboration_type: 'collaborative' | 'personal' | 'locked';
  is_default: boolean;
  is_favorite: boolean;
  sort_order: number;
  section_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViewConfig {
  filters?: Array<{ field: string; op: string; value: string }>;
  sorts?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  groupBy?: string;
  fieldVisibility?: Record<string, boolean>;
  fieldOrder?: string[];
  rowHeight?: 'compact' | 'default' | 'tall';
  pinnedColumns?: string[];
  colorRules?: Array<{ field: string; value: string; color: string }>;
}

interface UseEntityViewsOptions {
  entityType: string;
}

/**
 * Hook for managing saved views for a specific entity type.
 * Provides full CRUD operations and active view tracking.
 */
export function useEntityViews({ entityType }: UseEntityViewsOptions) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch views on mount
  useEffect(() => {
    async function fetchViews() {
      setLoading(true);
      try {
        const res = await fetch(`/api/saved-views?entity_type=${entityType}`);
        if (!res.ok) throw new Error('Failed to fetch views');
        const data = await res.json();
        setViews(data);
        // Auto-select default view
        const defaultView = data.find((v: SavedView) => v.is_default);
        if (defaultView) setActiveViewId(defaultView.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading views');
      } finally {
        setLoading(false);
      }
    }
    void fetchViews();
  }, [entityType]);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;

  const createView = useCallback(
    async (view: Partial<SavedView>) => {
      const res = await fetch('/api/saved-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...view, entity_type: entityType }),
      });
      if (!res.ok) throw new Error('Failed to create view');
      const newView = await res.json();
      setViews((prev) => [...prev, newView]);
      setActiveViewId(newView.id);
      return newView as SavedView;
    },
    [entityType],
  );

  const updateView = useCallback(
    async (id: string, updates: Partial<SavedView>) => {
      const res = await fetch(`/api/saved-views/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update view');
      const updated = await res.json();
      setViews((prev) => prev.map((v) => (v.id === id ? updated : v)));
      return updated as SavedView;
    },
    [],
  );

  const deleteView = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/saved-views/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete view');
      setViews((prev) => prev.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewId(null);
    },
    [activeViewId],
  );

  const duplicateView = useCallback(
    async (id: string) => {
      const source = views.find((v) => v.id === id);
      if (!source) return;
      return createView({
        ...source,
        name: `${source.name} (copy)`,
        is_default: false,
        is_favorite: false,
      });
    },
    [views, createView],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const view = views.find((v) => v.id === id);
      if (!view) return;
      return updateView(id, { is_favorite: !view.is_favorite } as Partial<SavedView>);
    },
    [views, updateView],
  );

  return {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
    toggleFavorite,
    loading,
    error,
  };
}
