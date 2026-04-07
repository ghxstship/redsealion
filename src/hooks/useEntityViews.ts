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
 * Currently uses localStorage since backend APIs are not yet wired.
 */
export function useEntityViews({ entityType }: UseEntityViewsOptions) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `redsealion_views_${entityType}`;

  // Fetch views on mount from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedView[];
        setViews(parsed);
        const defaultView = parsed.find((v) => v.is_default) || parsed[0];
        if (defaultView) setActiveViewId(defaultView.id);
      } else {
        // Create an initial default 'All' view if none exists
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
        window.localStorage.setItem(storageKey, JSON.stringify([defaultView]));
      }
    } catch (err) {
      setError('Error loading views from local storage');
    } finally {
      setLoading(false);
    }
  }, [entityType, storageKey]);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;

  const saveToStorage = useCallback((newViews: SavedView[]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(newViews));
    setViews(newViews);
  }, [storageKey]);

  const createView = useCallback(
    async (view: Partial<SavedView>) => {
      const newView: SavedView = {
        id: crypto.randomUUID(),
        entity_type: entityType,
        display_type: view.display_type ?? 'table',
        name: view.name ?? 'New View',
        description: view.description ?? null,
        icon: view.icon ?? null,
        config: view.config ?? {},
        collaboration_type: view.collaboration_type ?? 'personal',
        is_default: view.is_default ?? false,
        is_favorite: view.is_favorite ?? false,
        sort_order: view.sort_order ?? views.length,
        section_id: view.section_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const nextViews = [...views, newView];
      saveToStorage(nextViews);
      setActiveViewId(newView.id);
      return newView;
    },
    [entityType, views, saveToStorage],
  );

  const updateView = useCallback(
    async (id: string, updates: Partial<SavedView>) => {
      let updatedView: SavedView | null = null;
      const nextViews = views.map((v) => {
        if (v.id === id) {
          updatedView = { ...v, ...updates, updated_at: new Date().toISOString() };
          return updatedView;
        }
        return v;
      });
      
      if (!updatedView) throw new Error('View not found');
      saveToStorage(nextViews);
      return updatedView as SavedView;
    },
    [views, saveToStorage],
  );

  const deleteView = useCallback(
    async (id: string) => {
      // Don't delete the last view
      if (views.length <= 1) return;
      
      const nextViews = views.filter((v) => v.id !== id);
      saveToStorage(nextViews);
      
      if (activeViewId === id) {
        setActiveViewId(nextViews.find(v => v.is_default)?.id ?? nextViews[0]?.id ?? null);
      }
    },
    [views, activeViewId, saveToStorage],
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
