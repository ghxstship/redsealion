'use client';

/**
 * Interactive portfolio grid with category filtering and item management.
 * Addresses GAP-P07 (edit/delete), GAP-P09 (interactive filter), GAP-P31 (unified categories).
 */

import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

/** Canonical portfolio categories — shared between form and filter. */
export const PORTFOLIO_CATEGORIES = [
  'Brand Activation',
  'Concert & Festival',
  'Corporate Event',
  'Film & TV',
  'Immersive Experience',
  'Pop-Up',
  'Trade Show',
  'Other',
] as const;

export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
}

interface PortfolioGridProps {
  items: PortfolioItem[];
}

export default function PortfolioGrid({ items: initialItems }: PortfolioGridProps) {
  const [items, setItems] = useState(initialItems);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive categories present in data + the canonical list
  const categories = useMemo(() => {
    const uniqueCategories = new Set(items.map((i) => i.category));
    return ['All', ...PORTFOLIO_CATEGORIES.filter((c) => uniqueCategories.has(c))];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  }

  return (
    <>
      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cat === activeCategory
                ? 'bg-foreground text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 text-[10px] opacity-60">
                {items.filter((i) => i.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-xl border border-border bg-background overflow-hidden transition-colors hover:border-foreground/20"
          >
            {/* Action buttons — visible on hover */}
            <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={`/app/portfolio/${item.id}`}
                className="rounded-lg bg-background/80 backdrop-blur p-1.5 text-text-muted hover:text-foreground shadow-sm border border-border/50"
                title="Edit"
              >
                <Pencil size={14} />
              </a>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="rounded-lg bg-background/80 backdrop-blur p-1.5 text-text-muted hover:text-red-500 shadow-sm border border-border/50 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Image */}
            <div className="relative aspect-[4/3] bg-bg-tertiary flex items-center justify-center overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.project_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-text-muted">{item.client_name ?? 'Project'}</p>
                  <p className="mt-1 text-xs text-text-muted">No image</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {item.project_name}
                </p>
                {item.project_year && (
                  <span className="shrink-0 text-xs tabular-nums text-text-muted">
                    {item.project_year}
                  </span>
                )}
              </div>
              {item.client_name && (
                <p className="mt-0.5 text-xs text-text-muted">{item.client_name}</p>
              )}
              <span className="mt-2 inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && activeCategory !== 'All' && (
        <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">No projects in the &quot;{activeCategory}&quot; category.</p>
          <button
            onClick={() => setActiveCategory('All')}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            Show all projects
          </button>
        </div>
      )}
    </>
  );
}
