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
 * Connects to the /api/saved-views backend endpoint.
 */
export function useEntityViews({ entityType }: UseEntityViewsOptions) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch views on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchViews() {
      try {
        setLoading(true);
        const res = await fetch(`/api/saved-views?entity_type=${entityType}`);
        if (!res.ok) throw new Error('Failed to fetch views');
        const data = await res.json() as SavedView[];
        
        if (isMounted) {
          if (data && data.length > 0) {
            setViews(data);
            const defaultView = data.find((v) => v.is_default) || data[0];
            if (defaultView) setActiveViewId(defaultView.id);
          } else {
            // Create an initial default 'All' view locally if none exists
            const defaultView: SavedView = {
              id: 'default-all',
              entity_type: entityType,
              display_type: 'table',
              name: 'All',
              description: null,
              icon: null,
              config: {},
              collaboration_type: 'personal',
              is_default: true,
              is_favorite: false,
              sort_order: 0,
              section_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setViews([defaultView]);
            setActiveViewId(defaultView.id);
          }
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error loading views');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchViews();
    return () => { isMounted = false; };
  }, [entityType]);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;

  const createView = useCallback(
    async (view: Partial<SavedView>) => {
      try {
        const res = await fetch('/api/saved-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...view, entity_type: entityType }),
        });
        if (!res.ok) throw new Error('Failed to create view');
        const newView = await res.json() as SavedView;
        
        setViews(prev => {
          // If the only view we had was the default-all stub, replace it or keep it?
          // Let's keep it but just append the new one.
          return [...prev.filter(v => v.id !== 'default-all'), newView];
        });
        setActiveViewId(newView.id);
        return newView;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
    [entityType],
  );

  const updateView = useCallback(
    async (id: string, updates: Partial<SavedView>) => {
      // Optimistic update
      setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates, updated_at: new Date().toISOString() } : v));
      
      try {
        // If it's a local-only default view, don't ping the server
        if (id === 'default-all') return null;

        const res = await fetch(`/api/saved-views/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update view');
        const updatedView = await res.json() as SavedView;
        
        setViews(prev => prev.map(v => v.id === id ? updatedView : v));
        return updatedView;
      } catch (err) {
        console.error(err);
        // We could revert optimistic update here, but for simplicity skipping
        return null;
      }
    },
    [],
  );

  const deleteView = useCallback(
    async (id: string) => {
      // Don't delete the last view
      if (views.length <= 1) return;
      
      const newActiveFallback = views.find(v => v.is_default && v.id !== id) ?? views.find(v => v.id !== id);

      // Optimistic delete
      setViews(prev => prev.filter(v => v.id !== id));
      if (activeViewId === id && newActiveFallback) {
        setActiveViewId(newActiveFallback.id);
      }

      try {
        if (id !== 'default-all') {
          const res = await fetch(`/api/saved-views/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete view');
        }
      } catch (err) {
        console.error(err);
        // On error, we'd ideally revert.
      }
    },
    [views, activeViewId],
  );

  const duplicateView = useCallback(
    async (id: string) => {
      const source = views.find((v) => v.id === id);
      if (!source) return;
      return createView({
        name: `${source.name} (copy)`,
        display_type: source.display_type,
        config: source.config,
        collaboration_type: source.collaboration_type,
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
      return updateView(id, { is_favorite: !view.is_favorite });
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
