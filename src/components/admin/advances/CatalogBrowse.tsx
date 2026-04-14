'use client';

import { useState, useMemo } from 'react';
import FormInput from '@/components/ui/FormInput';
import EmptyState from '@/components/ui/EmptyState';
import type { AdvanceCatalogItem, AdvanceCatalogVariant, AdvanceSubcategory, AdvanceCategory, AdvanceCategoryGroup, AdvanceModifierList, AdvanceModifierOption } from '@/types/database';
import Button from '@/components/ui/Button';
import FitmentFilterPanel from './FitmentFilterPanel';
import FitmentBadgeRow from './FitmentBadgeRow';
import { useFitment } from '@/hooks/useFitment';

/* ═══════════════ Types ═══════════════ */

interface CatalogTreeGroup {
  group: AdvanceCategoryGroup;
  categories: Array<{
    category: AdvanceCategory;
    subcategories: Array<{ subcategory: AdvanceSubcategory; items: CatalogItemFull[] }>;
  }>;
}

export interface CatalogItemFull extends AdvanceCatalogItem {
  variants: AdvanceCatalogVariant[];
  modifier_lists: Array<AdvanceModifierList & { options: AdvanceModifierOption[] }>;
  subcategory?: AdvanceSubcategory | null;
  /** Computed: lowest variant price or null */
  base_price_cents?: number | null;
}

interface CatalogBrowseProps {
  groups: AdvanceCategoryGroup[];
  categories: AdvanceCategory[];
  subcategories: AdvanceSubcategory[];
  items: CatalogItemFull[];
  onSelectItem: (item: CatalogItemFull) => void;
}

/* ═══════════════ Helpers ═══════════════ */

function formatPrice(cents: number | null): string {
  if (cents === null) return 'Contact';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
}

/* ═══════════════ Component ═══════════════ */

export default function CatalogBrowse({ groups, categories, subcategories, items, onSelectItem }: CatalogBrowseProps) {
  const [search, setSearch] = useState('');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const { searchFitment, loading: fitmentLoading } = useFitment();
  const [fitmentFilteredIds, setFitmentFilteredIds] = useState<Set<string> | null>(null);

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId), [groups, activeGroupId]);

  const handleFitmentChange = async (filters: Record<string, string>) => {
    if (Object.keys(filters).length === 0) {
      setFitmentFilteredIds(null);
      return;
    }
    try {
      // In a real app we might map activeGroup.name to code. Here we just pass the ID or name if needed
      const res = await searchFitment({ ...filters }); 
      setFitmentFilteredIds(new Set(res.map((r: { item_id: string }) => r.item_id)));
    } catch(e) {
      console.error(e);
    }
  };

  // Build tree
  const tree = useMemo<CatalogTreeGroup[]>(() => {
    const subItemMap = new Map<string, CatalogItemFull[]>();
    for (const item of items) {
      if (!item.subcategory_id) continue;
      const arr = subItemMap.get(item.subcategory_id) ?? [];
      arr.push(item);
      subItemMap.set(item.subcategory_id, arr);
    }

    return groups
      .filter((g) => g.is_active !== false)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((group) => ({
        group,
        categories: categories
          .filter((c) => c.group_id === group.id && c.is_active !== false)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((category) => ({
            category,
            subcategories: subcategories
              .filter((s) => s.category_id === category.id && s.is_active !== false)
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((subcategory) => ({
                subcategory,
                items: (subItemMap.get(subcategory.id) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
              })),
          })),
      }));
  }, [groups, categories, subcategories, items]);

  // Filter
  const lowerSearch = search.toLowerCase();
  const filteredItems = useMemo(() => {
    if (!lowerSearch) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(lowerSearch) ||
        (i.item_code ?? '').toLowerCase().includes(lowerSearch) ||
        (i.description ?? '').toLowerCase().includes(lowerSearch)
    );
  }, [items, lowerSearch]);

  // Active view
  const visibleItems = useMemo(() => {
    let result = items;
    
    if (lowerSearch) {
      result = filteredItems;
    } else if (activeCategoryId) {
      const subs = subcategories.filter((s) => s.category_id === activeCategoryId);
      const subIds = new Set(subs.map((s) => s.id));
      result = result.filter((i) => i.subcategory_id && subIds.has(i.subcategory_id));
    } else if (activeGroupId) {
      const cats = categories.filter((c) => c.group_id === activeGroupId);
      const catIds = new Set(cats.map((c) => c.id));
      const subs = subcategories.filter((s) => catIds.has(s.category_id));
      const subIds = new Set(subs.map((s) => s.id));
      result = result.filter((i) => i.subcategory_id && subIds.has(i.subcategory_id));
    }

    if (fitmentFilteredIds !== null) {
      result = result.filter((i) => fitmentFilteredIds.has(i.id));
    }

    return result;
  }, [items, filteredItems, lowerSearch, activeGroupId, activeCategoryId, categories, subcategories, fitmentFilteredIds]);

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar — Category Tree */}
      <nav className="w-56 shrink-0 rounded-xl border border-border bg-background overflow-y-auto max-h-[70vh]">
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Categories</p>
        </div>
        <ul className="py-1">
          <li>
            <Button
              onClick={() => { setActiveGroupId(null); setActiveCategoryId(null); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                !activeGroupId ? 'bg-brand-50 text-brand-700 font-medium' : 'text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              All Items ({items.length})
            </Button>
          </li>
          {tree.map((node) => {
            const groupItemCount = node.categories.reduce(
              (sum, c) => sum + c.subcategories.reduce((s2, s) => s2 + s.items.length, 0), 0
            );
            return (
              <li key={node.group.id}>
                <Button
                  onClick={() => { setActiveGroupId(node.group.id); setActiveCategoryId(null); }}
                  className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeGroupId === node.group.id ? 'bg-brand-50 text-brand-700' : 'text-foreground hover:bg-bg-secondary'
                  }`}
                >
                  {node.group.name}
                  <span className="ml-1.5 text-xs text-text-muted">({groupItemCount})</span>
                </Button>
                {activeGroupId === node.group.id && (
                  <ul className="ml-3 border-l border-border">
                    {node.categories.map((cn) => {
                      const catCount = cn.subcategories.reduce((s, sub) => s + sub.items.length, 0);
                      return (
                        <li key={cn.category.id}>
                          <Button
                            onClick={() => setActiveCategoryId(cn.category.id)}
                            className={`w-full text-left pl-3 pr-2 py-1 text-xs transition-colors ${
                              activeCategoryId === cn.category.id ? 'text-brand-700 font-medium' : 'text-text-secondary hover:text-foreground'
                            }`}
                          >
                            {cn.category.name}
                            <span className="ml-1 text-text-muted">({catCount})</span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        
        <div className="mt-4 px-3 pb-4">
          <FitmentFilterPanel 
            collectionCode={(activeGroup as { code?: string })?.code || undefined} 
            onFilterChange={handleFitmentChange} 
          />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="mb-4">
          <FormInput
            placeholder="Search catalog by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Results */}
        {visibleItems.length === 0 ? (
          <EmptyState message="No items found" description="Try adjusting your search or category filters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {visibleItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group text-left rounded-xl border border-border bg-background p-4 transition-all hover:border-brand-300 hover:shadow-md hover:shadow-brand-50/50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-700 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-600">
                    {formatPrice(item.base_price_cents ?? item.variants[0]?.price_cents ?? null)}
                  </span>
                </div>

                {item.item_code && (
                  <p className="text-[11px] text-text-muted mb-1 font-mono">{item.item_code}</p>
                )}

                {item.description && (
                  <p className="text-xs text-text-secondary line-clamp-2 mb-2">{item.description}</p>
                )}

                {(item as { is_discontinued?: boolean }).is_discontinued && (
                  <span className="inline-flex mb-2 items-center rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
                    Discontinued
                  </span>
                )}

                {/* Fitment badges mock display - typically passed down if available from state, but for simplicity here we assume item may have it attached via backend later */}
                {fitmentFilteredIds?.has(item.id) && (
                  <FitmentBadgeRow fitRating={5} matchingDimCount={1} />
                )}

                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">
                    {item.default_unit_of_measure ?? 'each'}
                  </span>
                  {item.variants.length > 1 && (
                    <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                      {item.variants.length} variants
                    </span>
                  )}
                  {item.modifier_lists.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {item.modifier_lists.length} options
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
