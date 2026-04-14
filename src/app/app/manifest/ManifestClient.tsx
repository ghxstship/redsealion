'use client';

import { useState, useEffect, useCallback } from 'react';
import { Hammer, ShoppingCart, Package, Store } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

const FULFILLMENT_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  build:    { label: 'Build',    color: '#FF6B35', icon: <Hammer size={14} /> },
  purchase: { label: 'Purchase', color: '#4A90D9', icon: <ShoppingCart size={14} /> },
  rent:     { label: 'Rent',     color: '#7B61FF', icon: <Package size={14} /> },
  internal: { label: 'Internal', color: '#2ECC71', icon: <Store size={14} /> },
};

interface ManifestClientProps {
  projects: Array<{ id: string; name: string; slug: string; hierarchy_status: string | null }>;
  events: Array<{ id: string; name: string; slug: string; starts_at: string | null; ends_at: string | null; hierarchy_status: string | null }>;
  catalogGroups: Array<{ id: string; name: string; slug: string; color_hex: string | null; icon: string | null }>;
}

interface ManifestItem {
  component_item_id: string;
  component_id: string;
  component_name: string;
  activation_id: string;
  activation_name: string;
  space_id: string | null;
  space_name: string | null;
  zone_id: string;
  zone_name: string;
  event_id: string;
  event_name: string;
  catalog_item_id: string;
  item_name: string;
  item_code: string;
  group_name: string;
  group_slug: string;
  group_color: string;
  category_name: string;
  subcategory_name: string;
  quantity: number;
  line_total_cents: number;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function ManifestClient({ projects, events, catalogGroups }: ManifestClientProps) {
  // ── Scope selection ──
  const [scopeType, setScopeType] = useState<'project' | 'event'>('event');
  const [scopeId, setScopeId] = useState(events[0]?.id ?? '');

  // ── Filters ──
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string | null>(null);
  const [verticalFilter, setVerticalFilter] = useState<string | null>(null);

  // ── Data ──
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    total_items: number;
    by_vertical: Record<string, { group_name: string; group_color: string; total_items: number; total_cents: number }>;
  } | null>(null);

  const loadManifest = useCallback(async () => {
    if (!scopeId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope_type: scopeType,
        scope_id: scopeId,
      });
      if (verticalFilter) params.set('group_slug', verticalFilter);

      const res = await fetch(`/api/hierarchy/filter?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setSummary({ total_items: data.total_items, by_vertical: data.by_vertical });
      }
    } catch (err) {
      console.error('Failed to load manifest:', err);
    } finally {
      setLoading(false);
    }
  }, [scopeType, scopeId, verticalFilter]);

  useEffect(() => { loadManifest(); }, [loadManifest]);

  // Apply client-side fulfillment filter (since it's on component_items, not in the SQL function)
  const filtered = fulfillmentFilter
    ? items.filter(() => true) // All items pass for now — fulfillment comes from component_items.fulfillment_method
    : items;

  const totalCents = filtered.reduce((acc, i) => acc + (i.line_total_cents ?? 0), 0);
  const totalQty = filtered.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div>
      <PageHeader
        title="Manifest"
        subtitle="Production deliverables — build, purchase, rent, and internal fulfillment tracker"
      />

      {/* ── Scope Selector ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setScopeType('event')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              scopeType === 'event'
                ? 'bg-accent text-white'
                : 'bg-background text-text-secondary hover:bg-surface-raised'
            }`}
          >
            By Event
          </button>
          <button
            type="button"
            onClick={() => setScopeType('project')}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
              scopeType === 'project'
                ? 'bg-accent text-white'
                : 'bg-background text-text-secondary hover:bg-surface-raised'
            }`}
          >
            By Project
          </button>
        </div>

        <select
          value={scopeId}
          onChange={(e) => setScopeId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          {scopeType === 'event'
            ? events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)
            : projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
          }
        </select>

        <Button variant="ghost" size="sm" onClick={loadManifest}>Refresh</Button>
      </div>

      {/* ── Fulfillment Method Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider mr-2">Fulfillment</span>
        <button
          type="button"
          onClick={() => setFulfillmentFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !fulfillmentFilter
              ? 'bg-foreground text-background'
              : 'bg-surface-raised text-text-secondary hover:bg-border'
          }`}
        >
          All
        </button>
        {Object.entries(FULFILLMENT_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFulfillmentFilter(fulfillmentFilter === key ? null : key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5 ${
              fulfillmentFilter === key
                ? 'bg-foreground text-background'
                : 'bg-surface-raised text-text-secondary hover:bg-border'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Vertical Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider mr-2">Vertical</span>
        <button
          type="button"
          onClick={() => setVerticalFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            !verticalFilter
              ? 'bg-foreground text-background'
              : 'bg-surface-raised text-text-secondary hover:bg-border'
          }`}
        >
          All Verticals
        </button>
        {catalogGroups.map((g) => (
          <button
            key={g.slug}
            type="button"
            onClick={() => setVerticalFilter(verticalFilter === g.slug ? null : g.slug)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              verticalFilter === g.slug
                ? 'text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-border border-transparent'
            }`}
            style={verticalFilter === g.slug ? { backgroundColor: g.color_hex ?? '#666', borderColor: g.color_hex ?? '#666' } : {}}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Items</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{totalQty}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Line Items</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Cost</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{formatCents(totalCents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Verticals</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{Object.keys(summary?.by_vertical ?? {}).length}</p>
        </div>
      </div>

      {/* ── Manifest Table ── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {loading ? (
          <div className="px-8 py-12 text-center text-sm text-text-muted animate-pulse">
            Loading manifest…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No items in the manifest for this scope.</p>
            <p className="text-xs text-text-muted mt-1">
              Add items to components via Advancing to populate the manifest.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Activation</TableHead>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.component_item_id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{item.item_name}</span>
                      <span className="ml-2 font-mono text-[10px] text-text-muted">{item.item_code}</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {item.category_name} → {item.subcategory_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap border"
                      style={{ borderColor: item.group_color, color: item.group_color }}
                    >
                      {item.group_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{item.zone_name}</TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{item.activation_name}</div>
                    {item.space_name && (
                      <div className="text-xs text-text-muted">@ {item.space_name}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">{item.component_name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCents(item.line_total_cents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
