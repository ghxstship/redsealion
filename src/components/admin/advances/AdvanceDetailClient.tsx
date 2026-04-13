'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AdvanceLineItemRow from './AdvanceLineItemRow';
import CatalogBrowserPanel from './CatalogBrowserPanel';
import CatalogItemDetail from './CatalogItemDetail';
import AdHocItemForm from './AdHocItemForm';
import type { CatalogItemFull } from './CatalogBrowse';
import AdvanceStatusTimeline from './AdvanceStatusTimeline';
import AdvanceCommentThread from './AdvanceCommentThread';
import CollaboratorManager from './CollaboratorManager';
import {
  ADVANCE_STATUS_COLORS,
  ADVANCE_PRIORITY_COLORS,
  ADVANCE_MODE_COLORS,
} from './AdvanceStatusBadge';
import { ADVANCE_TYPE_CONFIG, ADVANCE_STATUS_CONFIG, getValidTransitions } from '@/lib/advances/constants';
import { formatCents, formatAdvanceDate } from '@/lib/advances/utils';
import type {
  ProductionAdvance,
  AdvanceLineItem,
  AdvanceStatusHistoryEntry,
  AdvanceComment,
  AdvanceCollaborator,
  AdvanceMode,
  AdvanceStatus,
} from '@/types/database';
import { castRelation } from '@/lib/supabase/cast-relation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

type AdvanceCommentWithUser = AdvanceComment & {
  users?: { full_name: string; avatar_url: string | null } | null;
};

type AdvanceCollaboratorWithJoins = AdvanceCollaborator & {
  users?: { full_name: string; email: string } | null;
  organizations?: { name: string } | null;
};

interface AdvanceDetailData {
  advance: ProductionAdvance;
  lineItems: AdvanceLineItem[];
  statusHistory: AdvanceStatusHistoryEntry[];
  comments: AdvanceCommentWithUser[];
  collaborators: AdvanceCollaboratorWithJoins[] | null;
  isOrgMember: boolean;
}

interface AdvanceDetailClientProps {
  data: AdvanceDetailData;
}

export default function AdvanceDetailClient({ data }: AdvanceDetailClientProps) {
  const router = useRouter();
  const { advance: a, lineItems: items, statusHistory: history, comments: cmts, collaborators, isOrgMember } = data;
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItemFull | null>(null);
  const [showAdHoc, setShowAdHoc] = useState(false);

  const typeConfig = ADVANCE_TYPE_CONFIG[a.advance_type];
  const validTransitions = getValidTransitions(a.advance_mode, a.status);
  const projectName = castRelation<{ name: string }>((a as Record<string, unknown>).projects)?.name ?? null;
  const isWritable = ['draft', 'open_for_submissions', 'changes_requested'].includes(a.status);

  async function performAction(action: string, body?: Record<string, unknown>) {
    const res = await fetch(`/api/advances/${a.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) router.refresh();
  }

  async function handleAddToAdvance(item: Record<string, unknown>) {
    const res = await fetch(`/api/advances/${a.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      setSelectedCatalogItem(null);
      router.refresh();
    }
  }

  // C-09: Line item approve/reject
  async function handleApproveItem(itemId: string) {
    const res = await fetch(`/api/advances/${a.id}/items/${itemId}/approve`, { method: 'POST' });
    if (res.ok) router.refresh();
  }
  async function handleRejectItem(itemId: string) {
    const res = await fetch(`/api/advances/${a.id}/items/${itemId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Rejected by reviewer' }),
    });
    if (res.ok) router.refresh();
  }

  // H-04 / M-02
  async function handleExport() {
    window.open(`/api/advances/${a.id}/export?format=csv`, '_blank');
  }
  async function handleDuplicate() {
    const res = await fetch(`/api/advances/${a.id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const { data: newAdv } = await res.json();
      router.push(`/app/advancing/${newAdv.id}`);
    }
  }

  // L-03: Group items by category
  const groupedItems = items.reduce<Record<string, typeof items>>((groups, item) => {
    const key = (item as Record<string, unknown>).category_group_slug as string ?? 'uncategorized';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/app/advancing" className="text-text-muted hover:text-foreground text-sm transition-colors">← Advances</Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{a.advance_number}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={a.status} colorMap={ADVANCE_STATUS_COLORS} />
            <StatusBadge status={a.advance_mode} colorMap={ADVANCE_MODE_COLORS} />
            <StatusBadge status={a.priority ?? 'medium'} colorMap={ADVANCE_PRIORITY_COLORS} />
            <span className="text-xs text-text-muted">{typeConfig?.label ?? a.advance_type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Workflow action buttons */}
          {isOrgMember && validTransitions.map((target) => {
            const config = ADVANCE_STATUS_CONFIG[target];
            const variant = target === 'cancelled' || target === 'rejected' ? 'danger' as const : target === 'approved' ? 'primary' as const : 'secondary' as const;
            return (
              <Button key={target} variant={variant} size="sm" onClick={() => {
                if (target === 'submitted') performAction('submit');
                else if (target === 'open_for_submissions') performAction('open');
                else if (target === 'approved') performAction('approve');
                else if (target === 'cancelled') performAction('cancel');
                else if (target === 'under_review') performAction('close-submissions');
                else if (target === 'rejected') performAction('reject');
                else if (target === 'changes_requested') performAction('request-changes');
                else if (target === 'on_hold') performAction('hold');
                else if (target === 'partially_fulfilled') performAction('fulfill', { target: 'partially_fulfilled' });
                else if (target === 'fulfilled') performAction('fulfill', { target: 'fulfilled' });
                else if (target === 'completed') performAction('fulfill', { target: 'completed' });
              }}>
                {config?.label ?? target}
              </Button>
            );
          })}
          {isOrgMember && (
            <>
              <Button variant="secondary" size="sm" onClick={handleExport}>Export CSV</Button>
              <Button variant="secondary" size="sm" onClick={handleDuplicate}>Duplicate</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Context card */}
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {a.event_name && (
                <div>
                  <dt className="text-text-muted text-xs">Event</dt>
                  <dd className="font-medium text-foreground">{a.event_name}</dd>
                </div>
              )}
              {a.venue_name && (
                <div>
                  <dt className="text-text-muted text-xs">Venue</dt>
                  <dd className="font-medium text-foreground">{a.venue_name}</dd>
                </div>
              )}
              {projectName && (
                <div>
                  <dt className="text-text-muted text-xs">Project</dt>
                  <dd className="font-medium text-foreground">{projectName}</dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted text-xs">Service Dates</dt>
                <dd className="font-medium text-foreground">
                  {formatAdvanceDate(a.service_start_date)} — {formatAdvanceDate(a.service_end_date)}
                </dd>
              </div>
              {a.load_in_date && (
                <div>
                  <dt className="text-text-muted text-xs">Load In</dt>
                  <dd className="font-medium text-foreground">{formatAdvanceDate(a.load_in_date)}</dd>
                </div>
              )}
              {a.strike_date && (
                <div>
                  <dt className="text-text-muted text-xs">Strike</dt>
                  <dd className="font-medium text-foreground">{formatAdvanceDate(a.strike_date)}</dd>
                </div>
              )}
            </dl>
            {a.purpose && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Purpose</p>
                <p className="text-sm text-text-secondary">{a.purpose}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border bg-background">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Line Items <span className="text-text-muted font-normal">({items.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                {isWritable && (
                  <Button variant="primary" size="sm" onClick={() => setShowCatalog(true)}>
                    + Add Items
                  </Button>
                )}
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {(a.total_cents ?? 0) > 0 ? formatCents(a.total_cents ?? 0) : '—'}
                </span>
              </div>
            </div>
            {items.length === 0 ? (
              <div className="p-4">
                <EmptyState message="No line items yet" description="Add items from the catalog or create ad-hoc entries." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table >
                  <TableHeader>
                    <TableRow className="border-b border-border bg-bg-secondary/50">
                      <TableHead className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Item</TableHead>
                      <TableHead className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Qty</TableHead>
                      <TableHead className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Unit Price</TableHead>
                      <TableHead className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</TableHead>
                      {a.advance_mode === 'collection' && (
                        <TableHead className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Approval</TableHead>
                      )}
                      <TableHead className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody >
                    {Object.entries(groupedItems).map(([groupSlug, groupItems]) => (
                      <>
                        {Object.keys(groupedItems).length > 1 && (
                          <TableRow key={`group-${groupSlug}`} className="bg-bg-secondary/30">
                            <TableCell colSpan={6} className="px-4 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                              {groupSlug.replace(/-/g, ' ')}
                            </TableCell>
                          </TableRow>
                        )}
                        {groupItems.map((item) => (
                          <AdvanceLineItemRow
                            key={item.id}
                            item={item}
                            showApproval={a.advance_mode === 'collection'}
                            onApprove={isOrgMember ? () => handleApproveItem(item.id) : undefined}
                            onReject={isOrgMember ? () => handleRejectItem(item.id) : undefined}
                          />
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Comments */}
          <AdvanceCommentThread
            advanceId={a.id}
            comments={cmts}
            onRefresh={() => router.refresh()}
            isOrgMember={isOrgMember}
          />
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Financials */}
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Financial Summary</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Subtotal</dt>
                <dd className="tabular-nums font-medium">{formatCents(a.subtotal_cents ?? 0)}</dd>
              </div>
              {(a.tax_total_cents ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Tax</dt>
                  <dd className="tabular-nums">{formatCents(a.tax_total_cents ?? 0)}</dd>
                </div>
              )}
              {(a.discount_total_cents ?? 0) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">Discount</dt>
                  <dd className="tabular-nums text-green-600">-{formatCents(a.discount_total_cents ?? 0)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="tabular-nums font-semibold text-foreground">{formatCents(a.total_cents ?? 0)}</dd>
              </div>
            </dl>
          </div>

          {/* M-11: Power Requirements Aggregation */}
          {(() => {
            const powerItems = items.filter((item) => (item as Record<string, unknown>).power_requirements);
            if (powerItems.length === 0) return null;
            const totalAmps = powerItems.reduce((sum, item) => {
              const pr = (item as Record<string, unknown>).power_requirements as Record<string, unknown> | null;
              return sum + ((pr?.amperage as number) ?? 0) * ((item.quantity as number) ?? 1);
            }, 0);
            const totalWatts = powerItems.reduce((sum, item) => {
              const pr = (item as Record<string, unknown>).power_requirements as Record<string, unknown> | null;
              return sum + ((pr?.wattage as number) ?? 0) * ((item.quantity as number) ?? 1);
            }, 0);
            return (
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Power Requirements</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Items requiring power</dt>
                    <dd className="tabular-nums font-medium">{powerItems.length}</dd>
                  </div>
                  {totalAmps > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Total Amps</dt>
                      <dd className="tabular-nums font-medium">{totalAmps.toLocaleString()}A</dd>
                    </div>
                  )}
                  {totalWatts > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Total Watts</dt>
                      <dd className="tabular-nums font-medium">{(totalWatts / 1000).toFixed(1)}kW</dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })()}

          {/* Status Timeline */}
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">History</h3>
            <AdvanceStatusTimeline history={history} />
          </div>

          {/* Collaborators (collection mode only) */}
          {a.advance_mode === 'collection' && collaborators && (
            <CollaboratorManager
              advanceId={a.id}
              collaborators={collaborators}
              onRefresh={() => router.refresh()}
            />
          )}
        </div>
      </div>
      {/* Catalog slide-out panel */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCatalog(false); setSelectedCatalogItem(null); }} />
          <div className="relative ml-auto w-full max-w-2xl bg-background border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedCatalogItem ? 'Configure Item' : showAdHoc ? 'Ad-Hoc Item' : 'Browse Catalog'}
              </h2>
              <button
                className="text-text-muted hover:text-foreground p-1 transition-colors"
                onClick={() => { setShowCatalog(false); setSelectedCatalogItem(null); }}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedCatalogItem ? (
                <CatalogItemDetail
                  item={selectedCatalogItem}
                  onAddToCart={(configured) => handleAddToAdvance(configured as unknown as Record<string, unknown>)}
                  onClose={() => setSelectedCatalogItem(null)}
                />
              ) : showAdHoc ? (
                <AdHocItemForm onAdd={(item) => { handleAddToAdvance(item); setShowAdHoc(false); }} onBack={() => setShowAdHoc(false)} />
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    <Button variant="secondary" size="sm" onClick={() => setShowAdHoc(true)}>+ Ad-Hoc Item</Button>
                  </div>
                  <CatalogBrowserPanel
                    onSelectItem={(item) => setSelectedCatalogItem(item)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
