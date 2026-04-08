'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import AdvanceLineItemRow from './AdvanceLineItemRow';
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

  const typeConfig = ADVANCE_TYPE_CONFIG[a.advance_type];
  const validTransitions = getValidTransitions(a.advance_mode, a.status);
  const projectName = castRelation<{ name: string }>((a as Record<string, unknown>).projects)?.name ?? null;

  async function performAction(action: string) {
    const res = await fetch(`/api/advances/${a.id}/${action}`, { method: 'POST' });
    if (res.ok) router.refresh();
  }

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
              }}>
                {config?.label ?? target}
              </Button>
            );
          })}
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
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {(a.total_cents ?? 0) > 0 ? formatCents(a.total_cents ?? 0) : '—'}
              </span>
            </div>
            {items.length === 0 ? (
              <div className="p-4">
                <EmptyState message="No line items yet" description="Add items from the catalog or create ad-hoc entries." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary/50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                      {a.advance_mode === 'collection' && (
                        <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Approval</th>
                      )}
                      <th className="px-4 py-2 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                      <AdvanceLineItemRow
                        key={item.id}
                        item={item}
                        showApproval={a.advance_mode === 'collection'}
                      />
                    ))}
                  </tbody>
                </table>
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
    </div>
  );
}
