import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { formatStatus, phaseColorMap, type ProposalData, type PhaseData } from './_detail-types';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';

/**
 * Overview tab for the proposal detail page.
 * Renders summary stat cards, phase progress bar,
 * investment breakdown table, and proposal tags.
 */
export default function OverviewTab({
  proposal,
  phases,
  totalPhaseInvestment,
  completedPhases,
  proposalId,
}: {
  proposal: ProposalData;
  phases: PhaseData[];
  totalPhaseInvestment: number;
  completedPhases: number;
  proposalId: string;
}) {
  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Total Value
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCurrency(proposal.total_value, proposal.currency)}
          </p>
          {proposal.total_with_addons > proposal.total_value && (
            <p className="mt-1 text-xs text-text-secondary">
              {formatCurrency(proposal.total_with_addons, proposal.currency)}{' '}
              with add-ons
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Probability
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {proposal.probability_percent ?? 0}%
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Weighted:{' '}
            {formatCurrency(
              (proposal.total_value * (proposal.probability_percent ?? 0)) / 100,
              proposal.currency,
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Phases
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {completedPhases}/{phases.length}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {phases.length === 0
              ? 'No phases yet'
              : completedPhases === phases.length
                ? 'All complete'
                : 'completed'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Valid Until
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {proposal.valid_until
              ? new Date(proposal.valid_until).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '\u2014'}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {proposal.valid_until
              ? new Date(proposal.valid_until).getFullYear().toString()
              : 'No expiry set'}
          </p>
        </div>
      </div>

      {/* Phase progress timeline */}
      {phases.length > 0 && (
        <div className="rounded-xl border border-border bg-background px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Phase Progress
          </h2>
          <div className="flex gap-1.5">
            {phases.map((phase) => (
              <div key={phase.id} className="flex-1 group relative">
                <div
                  className={`h-2.5 rounded-full ${phaseColorMap[phase.status] ?? 'bg-border'}`}
                />
                <div className="mt-2 hidden sm:block">
                  <p className="text-xs font-medium text-foreground truncate">
                    {phase.phase_number}
                  </p>
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-white whitespace-nowrap shadow-lg">
                    <p className="font-medium">{phase.name}</p>
                    <p className="mt-0.5 opacity-75">
                      {formatStatus(phase.status)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phases investment table */}
      {phases.length > 0 ? (
        <div className="rounded-xl border border-border bg-background">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Investment Summary
            </h2>
          </div>
          <div className="divide-y divide-border">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className="flex items-center justify-between px-6 py-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-text-muted w-6 shrink-0">
                    {phase.phase_number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {phase.name}
                    </p>
                    {phase.subtitle ? (
                      <p className="text-xs text-text-muted truncate">
                        {phase.subtitle}
                      </p>
                    ) : (
                      <EmptyState
                        message="No milestones assigned yet"
                        className="border-0 shadow-none px-0 py-1 justify-start"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <StatusBadge status={phase.status} colorMap={GENERIC_STATUS_COLORS} />
                  <span className="text-sm font-medium text-foreground tabular-nums w-20 text-right">
                    {formatCurrency(phase.phase_investment, proposal.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-secondary rounded-b-xl">
            <p className="text-sm font-semibold text-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatCurrency(totalPhaseInvestment, proposal.currency)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-background px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">
            No phases have been added to this proposal yet.
          </p>
          <Link
            href={`/app/proposals/${proposalId}/builder`}
            className="mt-3 inline-block text-sm font-medium text-brand-primary hover:text-brand-primary/80"
          >
            Open Builder to add phases →
          </Link>
        </div>
      )}

      {/* Tags */}
      {proposal.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {proposal.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Payment Terms */}
      {proposal.payment_terms && (
        <div className="rounded-xl border border-border bg-background px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Payment Terms
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Structure
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground capitalize">
                {proposal.payment_terms.structure?.replace(/_/g, ' ') ?? 'Standard'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Deposit
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                {proposal.payment_terms.depositPercent ?? 0}%
                <span className="text-text-muted ml-1">
                  ({formatCurrency((proposal.total_value * (proposal.payment_terms.depositPercent ?? 0)) / 100, proposal.currency)})
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Balance Due
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                {proposal.payment_terms.balancePercent ?? 0}%
                <span className="text-text-muted ml-1">
                  ({formatCurrency((proposal.total_value * (proposal.payment_terms.balancePercent ?? 0)) / 100, proposal.currency)})
                </span>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
