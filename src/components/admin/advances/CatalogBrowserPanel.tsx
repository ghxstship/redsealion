'use client';

import { useState, useEffect } from 'react';
import CatalogBrowse from './CatalogBrowse';
import type { CatalogItemFull } from './CatalogBrowse';
import type {
  AdvanceCategoryGroup,
  AdvanceCategory,
  AdvanceSubcategory,
} from '@/types/database';

/**
 * Self-fetching catalog browser wrapper.
 *
 * CatalogBrowse is a pure presentational component that expects
 * groups, categories, subcategories, and items as props.
 * This wrapper fetches from /api/advances/catalog/tree on mount.
 */

interface CatalogBrowserPanelProps {
  onSelectItem: (item: CatalogItemFull) => void;
}

export default function CatalogBrowserPanel({ onSelectItem }: CatalogBrowserPanelProps) {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<AdvanceCategoryGroup[]>([]);
  const [categories, setCategories] = useState<AdvanceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdvanceSubcategory[]>([]);
  const [items, setItems] = useState<CatalogItemFull[]>([]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch('/api/advances/catalog/tree');
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups ?? []);
          setCategories(data.categories ?? []);
          setSubcategories(data.subcategories ?? []);
          setItems(data.items ?? []);
        }
      } catch {
        // Silent fail — empty catalog
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0 && groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-text-muted">No catalog items found.</p>
        <p className="text-xs text-text-muted mt-1">Use the ad-hoc item form to add items manually.</p>
      </div>
    );
  }

  return (
    <CatalogBrowse
      groups={groups}
      categories={categories}
      subcategories={subcategories}
      items={items}
      onSelectItem={onSelectItem}
    />
  );
}
