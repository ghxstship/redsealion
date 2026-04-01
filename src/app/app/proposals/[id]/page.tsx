'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { getSeedProposals, getSeedClients, getSeedPhases } from '@/lib/seed-data';

type DetailTab = 'overview' | 'builder' | 'preview' | 'export' | 'activity';

const detailTabs: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'builder', label: 'Builder' },
  { key: 'preview', label: 'Preview' },
  { key: 'export', label: 'Export' },
  { key: 'activity', label: 'Activity' },
];

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const proposals = getSeedProposals();
const clients = getSeedClients();

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const proposal = useMemo(
    () => proposals.find((p) => p.id === id) ?? proposals[0],
    [id],
  );

  const client = useMemo(
    () => clients.find((c) => c.id === proposal.client_id),
    [proposal.client_id],
  );

  const phases = useMemo(() => getSeedPhases(proposal.id), [proposal.id]);

  const totalPhaseInvestment = useMemo(
    () => phases.reduce((sum, p) => sum + p.phase_investment, 0),
    [phases],
  );

  const completedPhases = phases.filter((p) => p.status === 'complete').length;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/proposals" className="hover:text-foreground transition-colors">
          Proposals
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{proposal.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
              {proposal.name}
            </h1>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(proposal.status)}`}
            >
              {formatStatus(proposal.status)}
            </span>
          </div>
          {proposal.subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{proposal.subtitle}</p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {client?.company_name ?? 'Unknown Client'}
            {proposal.prepared_date &&
              ` \u00B7 Prepared ${new Date(proposal.prepared_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {` \u00B7 v${proposal.version}`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
            Edit in Builder
          </button>
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Send to Client
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-border">
        <nav className="-mb-px flex gap-6">
          {detailTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-white px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Total Value
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {formatCurrency(proposal.total_value, proposal.currency)}
              </p>
              {proposal.total_with_addons > proposal.total_value && (
                <p className="mt-1 text-xs text-text-secondary">
                  {formatCurrency(proposal.total_with_addons, proposal.currency)} with add-ons
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-white px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Probability
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {proposal.probability ?? 0}%
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Weighted: {formatCurrency((proposal.total_value * (proposal.probability ?? 0)) / 100, proposal.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Phases
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {completedPhases}/{phases.length}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {completedPhases === phases.length ? 'All complete' : 'completed'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white px-5 py-5">
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
          <div className="rounded-xl border border-border bg-white px-6 py-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Phase Progress
            </h2>
            <div className="flex gap-1.5">
              {phases.map((phase) => {
                const phaseColorMap: Record<string, string> = {
                  complete: 'bg-green-500',
                  in_progress: 'bg-blue-500',
                  pending_approval: 'bg-amber-500',
                  approved: 'bg-green-400',
                  not_started: 'bg-gray-200',
                  skipped: 'bg-gray-100',
                };
                return (
                  <div key={phase.id} className="flex-1 group relative">
                    <div
                      className={`h-2.5 rounded-full ${phaseColorMap[phase.status] ?? 'bg-gray-200'}`}
                    />
                    <div className="mt-2 hidden sm:block">
                      <p className="text-xs font-medium text-foreground truncate">
                        {phase.number}
                      </p>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-white whitespace-nowrap shadow-lg">
                        <p className="font-medium">{phase.name}</p>
                        <p className="mt-0.5 opacity-75">{formatStatus(phase.status)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend - mobile */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 sm:hidden">
              {phases.map((phase) => (
                <p key={phase.id} className="text-xs text-text-muted">
                  <span className="font-medium text-foreground">{phase.number}</span>{' '}
                  {phase.name}
                </p>
              ))}
            </div>
          </div>

          {/* Phases detail */}
          <div className="rounded-xl border border-border bg-white">
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
                      {phase.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {phase.name}
                      </p>
                      {phase.subtitle && (
                        <p className="text-xs text-text-muted truncate">
                          {phase.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(phase.status)}`}
                    >
                      {formatStatus(phase.status)}
                    </span>
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

          {/* Project details */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Narrative context */}
            {proposal.narrative_context && (
              <div className="rounded-xl border border-border bg-white px-6 py-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Creative Context
                </h2>
                <dl className="space-y-3">
                  {proposal.narrative_context.brandVoice && (
                    <div>
                      <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Brand Voice
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {proposal.narrative_context.brandVoice}
                      </dd>
                    </div>
                  )}
                  {proposal.narrative_context.audienceProfile && (
                    <div>
                      <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Audience
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {proposal.narrative_context.audienceProfile}
                      </dd>
                    </div>
                  )}
                  {proposal.narrative_context.experienceGoal && (
                    <div>
                      <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Experience Goal
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {proposal.narrative_context.experienceGoal}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Payment terms */}
            {proposal.payment_terms && (
              <div className="rounded-xl border border-border bg-white px-6 py-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">
                  Payment Terms
                </h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Structure
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {proposal.payment_terms.structure}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Deposit
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {proposal.payment_terms.depositPercent}% ({formatCurrency(proposal.total_value * proposal.payment_terms.depositPercent / 100, proposal.currency)})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">
                      Balance
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">
                      {proposal.payment_terms.balancePercent}% ({formatCurrency(proposal.total_value * proposal.payment_terms.balancePercent / 100, proposal.currency)})
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

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
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-muted">
            Proposal Builder coming soon.
          </p>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-muted">
            Client preview coming soon.
          </p>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-muted">
            Export options coming soon.
          </p>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-muted">
            Activity log coming soon.
          </p>
        </div>
      )}
    </>
  );
}
