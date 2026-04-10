'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import ShareDialog from '@/components/shared/ShareDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Tabs from '@/components/ui/Tabs';
import {
  detailTabs,
  formatStatus,
  type DetailTab,
  type ProposalData,
  type PhaseData,
} from './_detail-types';
import OverviewTab from './OverviewTab';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import ProposalAnalytics from '@/components/admin/proposals/ProposalAnalytics';
import VersionComparison from '@/components/admin/proposals/VersionComparison';

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [phases, setPhases] = useState<PhaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [converting, setConverting] = useState(false);

  async function handleConvertToJob() {
    if (!proposal || proposal.status !== 'approved') return;
    setConverting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/convert`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Converted to Work Order successfully!');
      window.location.href = `/app/dispatch/${json.workOrder.id}`;
    } catch (err: any) {
      toast.error('Failed to convert: ' + err.message);
      setConverting(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        const { data: prop } = await supabase
          .from('proposals')
          .select('*, clients(company_name)')
          .eq('id', id)
          .single();

        if (prop) {
          setProposal({
            id: prop.id,
            name: prop.name,
            subtitle: prop.subtitle,
            status: prop.status,
            total_value: prop.total_value ?? 0,
            total_with_addons: prop.total_with_addons ?? prop.total_value ?? 0,
            probability_percent: prop.probability_percent,
            currency: prop.currency ?? 'USD',
            version: prop.version ?? 1,
            prepared_date: prop.prepared_date,
            valid_until: prop.valid_until,
            tags: prop.tags ?? [],
            narrative_context: prop.narrative_context as Record<
              string,
              string
            > | null,
            payment_terms: prop.payment_terms as ProposalData['payment_terms'],
            client_name:
              (prop.clients as Record<string, string>)?.company_name ??
              'Unknown',
          });
        }

        const { data: phaseRows } = await supabase
          .from('phases')
          .select('id, name, subtitle, phase_number, status, phase_investment')
          .eq('proposal_id', id)
          .order('phase_number');

        setPhases((phaseRows ?? []) as PhaseData[]);
      } catch {
        // Data will remain null/empty — handled by UI
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-text-muted">Loading proposal…</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-text-muted">Proposal not found.</p>
        <Link
          href="/app/proposals"
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Proposals
        </Link>
      </div>
    );
  }

  const totalPhaseInvestment = phases.reduce(
    (sum, p) => sum + p.phase_investment,
    0,
  );
  const completedPhases = phases.filter(
    (p) => p.status === 'complete',
  ).length;

  return (
    <>
      {/* Header */}
      <PageHeader
        title={<>{proposal.name}<span className={`ml-3 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(proposal.status)}`}>{formatStatus(proposal.status)}</span></>}
        subtitle={<>{proposal.client_name}{proposal.prepared_date && ` \u00B7 Prepared ${new Date(proposal.prepared_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}{` \u00B7 v${proposal.version}`}</>}
      >
        <Link
          href={`/app/proposals/${id}/builder`}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Edit in Builder
        </Link>
        <button
          onClick={() => setShowShare(true)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Share
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="rounded-lg border border-red-200 bg-background px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
        {proposal.status === 'approved' && (
          <Button onClick={handleConvertToJob} disabled={converting}>
            {converting ? 'Converting...' : 'Convert to Job'}
          </Button>
        )}
        <Button onClick={() => setShowShare(true)}>
          Send to Client
        </Button>
      </PageHeader>

      {/* Tabs */}
      <Tabs tabs={detailTabs} activeTab={activeTab} onTabChange={setActiveTab} className="mb-8" />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab
          proposal={proposal}
          phases={phases}
          totalPhaseInvestment={totalPhaseInvestment}
          completedPhases={completedPhases}
          proposalId={id}
        />
      )}

      {activeTab === 'builder' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-secondary mb-3">Edit this proposal using the interactive builder.</p>
          <Link href={`/app/proposals/${id}/builder`} className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Open Builder
          </Link>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-secondary mb-3">Preview how your client will see this proposal in the portal.</p>
          <Link href={`/app/proposals/${id}/export`} className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Preview & Export
          </Link>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <p className="text-sm text-text-secondary mb-3">Export this proposal as PDF, DOCX, or push to your CRM.</p>
          <Link href={`/app/proposals/${id}/export`} className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            Open Export Options
          </Link>
        </div>
      )}

      {activeTab === 'analytics' && (
        <ProposalAnalytics
          proposalId={id}
          proposalName={proposal.name}
        />
      )}

      {activeTab === 'versions' && (
        <VersionComparison
          proposalId={id}
          currency={proposal.currency}
        />
      )}

      {activeTab === 'activity' && (
        <div className="rounded-xl border border-border bg-background px-8 py-12 text-center">
          <p className="text-sm text-text-secondary">
            Proposal activity will appear here as your team and clients interact with this proposal.
          </p>
        </div>
      )}

      {proposal && (
        <ShareDialog
          open={showShare}
          onClose={() => setShowShare(false)}
          entityType="proposals"
          entityId={id}
          entityName={proposal.name}
        />
      )}

      {proposal && (
        <ConfirmDialog
          open={showDelete}
          title="Delete Proposal"
          message={`Are you sure you want to delete "${proposal.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            window.location.href = '/app/proposals';
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
}
