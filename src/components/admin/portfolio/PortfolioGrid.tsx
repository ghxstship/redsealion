'use client';

/**
 * Interactive portfolio grid with category filtering and item management.
 * Addresses GAP-P07 (edit/delete), GAP-P09 (interactive filter), GAP-P31 (unified categories).
 */

import { useState, useMemo } from 'react';
import { Pencil, Trash2, Globe, EyeOff } from 'lucide-react';
import PortfolioFormModal from './PortfolioFormModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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

type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

interface PortfolioItem {
  id: string;
  project_name: string;
  project_year: number | null;
  category: string;
  client_name: string | null;
  description: string | null;
  image_url: string | null;
  tags?: string[];
  project_id?: string | null;
  proposal_id?: string | null;
  is_published?: boolean;
}

interface PortfolioGridProps {
  items: PortfolioItem[];
}

export default function PortfolioGrid({ items: initialItems }: PortfolioGridProps) {
  const [items, setItems] = useState(initialItems);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PortfolioItem | null>(null);

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
    setDeletingId(id);
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch { /* silent */ }
    finally { setDeletingId(null); setShowDeleteConfirm(null); }
  }

  async function handleTogglePublish(item: PortfolioItem) {
    setPublishingId(item.id);
    try {
      const res = await fetch(`/api/portfolio/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !item.is_published }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) =>
          i.id === item.id ? { ...i, is_published: !i.is_published } : i
        ));
      }
    } catch { /* silent */ }
    finally { setPublishingId(null); }
  }

  return (
    <>
      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cat === activeCategory
                ? 'bg-foreground text-background'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 text-[10px] opacity-60">
                {items.filter((i) => i.category === cat).length}
              </span>
            )}
          </Button>
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
              <Button
                onClick={() => handleTogglePublish(item)}
                disabled={publishingId === item.id}
                className={`rounded-lg bg-background/80 backdrop-blur p-1.5 shadow-sm border border-border/50 ${
                  item.is_published ? 'text-green-600 hover:text-amber-600' : 'text-text-muted hover:text-green-600'
                }`}
                title={item.is_published ? 'Unpublish' : 'Publish'}
              >
                {item.is_published ? <EyeOff size={14} /> : <Globe size={14} />}
              </Button>
              <Button
                onClick={() => setItemToEdit(item)}
                className="rounded-lg bg-background/80 backdrop-blur p-1.5 text-text-muted hover:text-foreground shadow-sm border border-border/50"
                title="Edit"
              >
                <Pencil size={14} />
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(item.id)}
                disabled={deletingId === item.id}
                className="rounded-lg bg-background/80 backdrop-blur p-1.5 text-text-muted hover:text-red-500 shadow-sm border border-border/50 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
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
              <Badge variant="muted" className="mt-2">
                {item.category}
              </Badge>
              {item.is_published && (
                <Badge variant="success" className="mt-1">published</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && activeCategory !== 'All' && (
        <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">No projects in the &quot;{activeCategory}&quot; category.</p>
          <Button
            onClick={() => setActiveCategory('All')}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            Show all projects
          </Button>
        </div>
      )}

      <PortfolioFormModal
        open={!!itemToEdit}
        itemToEdit={itemToEdit}
        onClose={() => setItemToEdit(null)}
        onCreated={() => {
          setItemToEdit(null);
          window.location.reload();
        }}
      />

      {showDeleteConfirm && (
        <ConfirmDialog
          open
          title="Delete Portfolio Item"
          message="Are you sure you want to delete this portfolio item? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </>
  );
}
