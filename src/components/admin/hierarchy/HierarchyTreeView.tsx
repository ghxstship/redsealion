'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';

// ── Status color map for hierarchy_status ──
const HIERARCHY_STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  advancing: 'info',
  confirmed: 'success',
  locked: 'warning',
  complete: 'success',
  archived: 'default',
};

// ── Type definitions ──
interface HierarchyNode {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  status?: string;
  hierarchy_status?: string;
  sort_order?: number;
  overhead_cents?: number;
  markup_pct?: number;
  description?: string;
  children?: HierarchyNode[];
  activations?: HierarchyNode[];
  items?: ComponentItem[];
  // Zone-specific
  color_hex?: string;
  // Activation-specific
  space_id?: string;
  spaces?: { name: string; type: string };
  // Budget
  budget?: BudgetRollup;
}

interface ComponentItem {
  id: string;
  catalog_item_id: string;
  quantity: number;
  unit_price_cents: number;
  duration_days: number;
  line_total_cents: number;
  notes?: string;
  advance_catalog_items?: {
    name: string;
    item_code: string;
  };
}

interface BudgetRollup {
  items_total_cents: number;
  overhead_cents: number;
  markup_pct: number;
  markup_amount_cents: number;
  subtotal_cents: number;
}

interface HierarchyTreeProps {
  projectId: string;
  orgId: string;
  events: Array<{
    id: string;
    name: string;
    event_id?: string;
    starts_at?: string;
    ends_at?: string;
    status?: string;
    hierarchy_status?: string;
  }>;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(cents / 100);
}

// ── Collapsible Tree Node ──
function TreeNode({
  level,
  label,
  type,
  icon,
  node,
  defaultOpen = false,
  children,
}: {
  level: number;
  label: string;
  type: string;
  icon: string;
  node: HierarchyNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = !!children;
  const indent = level * 20;

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors text-left"
        style={{ paddingLeft: `${indent + 16}px` }}
      >
        {/* Expand/collapse indicator */}
        <span className="w-4 text-text-muted text-xs flex-shrink-0">
          {hasChildren ? (isOpen ? '▼' : '▶') : '·'}
        </span>

        {/* Icon */}
        <span className="text-base flex-shrink-0">{icon}</span>

        {/* Name + type badge */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{label}</span>
          {node.spaces?.name && (
            <span className="ml-2 text-xs text-text-muted">@ {node.spaces.name}</span>
          )}
        </div>

        {/* Type tag */}
        <Badge variant="default" className="text-[10px] uppercase tracking-wider">
          {type}
        </Badge>

        {/* Status */}
        {node.hierarchy_status && (
          <StatusBadge
            status={node.hierarchy_status}
            colorMap={HIERARCHY_STATUS_COLORS}
          />
        )}

        {/* Budget */}
        {node.budget && node.budget.subtotal_cents > 0 && (
          <span className="text-xs font-mono text-text-secondary ml-2 flex-shrink-0">
            {formatCents(node.budget.subtotal_cents)}
          </span>
        )}
      </button>

      {/* Items list (L6) */}
      {isOpen && node.items && node.items.length > 0 && (
        <div style={{ paddingLeft: `${indent + 60}px` }} className="pb-2">
          {node.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-1.5 px-3 text-xs text-text-secondary"
            >
              <span className="w-3 text-text-muted">◇</span>
              <span className="font-mono text-[10px] text-text-muted">
                {item.advance_catalog_items?.item_code}
              </span>
              <span className="flex-1 truncate">
                {item.advance_catalog_items?.name}
              </span>
              <span className="text-text-muted">×{item.quantity}</span>
              <span className="font-mono">{formatCents(item.line_total_cents)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Children */}
      {isOpen && children && <div>{children}</div>}
    </div>
  );
}

// ── Main Hierarchy Tree Component ──
export default function HierarchyTreeView({ projectId, orgId, events }: HierarchyTreeProps) {
  const [zones, setZones] = useState<Record<string, HierarchyNode[]>>({});
  const [loading, setLoading] = useState(true);

  const loadHierarchy = useCallback(async () => {
    setLoading(true);
    try {
      // Load zones for each event
      const zonesByEvent: Record<string, HierarchyNode[]> = {};

      for (const event of events) {
        const eventId = event.event_id || event.id;
        const res = await fetch(`/api/zones?event_id=${eventId}&org_id=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          zonesByEvent[eventId] = data;
        }
      }
      setZones(zonesByEvent);
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    } finally {
      setLoading(false);
    }
  }, [events, orgId]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-background p-12 text-center">
        <div className="animate-pulse text-text-muted text-sm">Loading hierarchy…</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-raised/30">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Production Hierarchy</h3>
          <p className="text-xs text-text-muted mt-0.5">
            L1 Project → L2 Event → L3 Zone → L4 Activation → L5 Component → L6 Item
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadHierarchy}>
          ↻ Refresh
        </Button>
      </div>

      {/* Tree */}
      <div className="divide-y divide-border/50">
        {events.map((event) => {
          const eventId = event.event_id || event.id;
          const eventZones = zones[eventId] ?? [];
          const eventNode: HierarchyNode = {
            id: eventId,
            name: event.name,
            hierarchy_status: event.hierarchy_status || event.status,
          };

          return (
            <TreeNode
              key={eventId}
              level={0}
              label={event.name}
              type="Event"
              icon="📅"
              node={eventNode}
              defaultOpen={true}
            >
              {eventZones.length === 0 ? (
                <div className="pl-16 py-3 text-xs text-text-muted italic">
                  No zones defined. Create a zone to organize activations.
                </div>
              ) : (
                eventZones.map((zone) => {
                  const zoneActivations = zone.activations ?? [];
                  return (
                    <TreeNode
                      key={zone.id}
                      level={1}
                      label={zone.name}
                      type={zone.type || 'Zone'}
                      icon="🏗️"
                      node={zone}
                      defaultOpen={true}
                    >
                      {zoneActivations.length === 0 ? (
                        <div className="pl-24 py-2 text-xs text-text-muted italic">
                          No activations in this zone.
                        </div>
                      ) : (
                        zoneActivations.map((activation) => {
                          const components = activation.children ?? [];
                          return (
                            <TreeNode
                              key={activation.id}
                              level={2}
                              label={activation.name}
                              type={activation.type || 'Activation'}
                              icon="⚡"
                              node={activation}
                              defaultOpen={false}
                            >
                              {components.map((component) => (
                                <TreeNode
                                  key={component.id}
                                  level={3}
                                  label={component.name}
                                  type={component.type || 'Component'}
                                  icon="🔧"
                                  node={component}
                                  defaultOpen={false}
                                />
                              ))}
                            </TreeNode>
                          );
                        })
                      )}
                    </TreeNode>
                  );
                })
              )}
            </TreeNode>
          );
        })}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">No events linked to this project.</p>
          <p className="text-xs text-text-muted mt-1">
            Link events to this project to build the production hierarchy.
          </p>
        </div>
      )}
    </div>
  );
}
