import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import type { DealStage } from '@/types/database';
import DealEmailDraft from '@/components/admin/pipeline/DealEmailDraft';
import DealRiskAssessment from '@/components/admin/pipeline/DealRiskAssessment';
import DealNextAction from '@/components/admin/pipeline/DealNextAction';

const STAGE_LABELS: Record<DealStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  verbal_yes: 'Verbal Yes',
  contract_signed: 'Contract Signed',
  lost: 'Lost',
  on_hold: 'On Hold',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface DealDetail {
  id: string;
  title: string;
  deal_value: number;
  stage: DealStage;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  lost_reason: string | null;
  won_date: string | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  owner_name: string | null;
  proposal_name: string | null;
  proposal_id: string | null;
  activities: Array<{
    id: string;
    type: string;
    description: string;
    created_at: string;
  }>;
}

async function getDeal(id: string): Promise<DealDetail | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: deal } = await supabase
      .from('deals')
      .select('*, clients(company_name), proposals(name), users!deals_owner_id_fkey(full_name)')
      .eq('id', id)
      .single();

    if (!deal) return null;

    const { data: activities } = await supabase
      .from('deal_activities')
      .select()
      .eq('deal_id', id)
      .order('created_at', { ascending: false });

    return {
      ...deal,
      client_name: (deal.clients as Record<string, string>)?.company_name ?? 'Unknown',
      owner_name: (deal.users as Record<string, string>)?.full_name ?? null,
      proposal_name: (deal.proposals as Record<string, string>)?.name ?? null,
      activities: activities ?? [],
    } as DealDetail;
  } catch {
    return null;
  }
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-text-muted">Deal not found.</p>
        <Link
          href="/app/pipeline"
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <TierGate feature="pipeline">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {deal.title}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {deal.client_name}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <DealEmailDraft
            dealTitle={deal.title}
            dealValue={deal.deal_value}
            dealStage={STAGE_LABELS[deal.stage]}
            clientName={deal.client_name}
            notes={deal.notes}
          />
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor(deal.stage)}`}
          >
            {STAGE_LABELS[deal.stage]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal details card */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Deal Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-text-muted">Value</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(deal.deal_value)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Probability</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {deal.probability}%
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Weighted Value</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(deal.deal_value * (deal.probability / 100))}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Expected Close</p>
                <p className="text-sm font-medium text-foreground">
                  {deal.expected_close_date
                    ? formatDate(deal.expected_close_date)
                    : 'Not set'}
                </p>
              </div>
            </div>
            {deal.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-secondary">{deal.notes}</p>
              </div>
            )}
          </div>

          {/* Linked proposal */}
          {deal.proposal_id && deal.proposal_name && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Linked Proposal
              </h2>
              <Link
                href={`/app/proposals/${deal.proposal_id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {deal.proposal_name}
              </Link>
            </div>
          )}

          {/* Activity timeline */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Activity
            </h2>
            <div className="space-y-0">
              {deal.activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {index < deal.activities.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                  )}
                  <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              Quick Info
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Client</dt>
                <dd className="font-medium text-foreground">{deal.client_name}</dd>
              </div>
              {deal.owner_name && (
                <div>
                  <dt className="text-text-muted">Owner</dt>
                  <dd className="font-medium text-foreground flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-bg-secondary text-[9px] font-semibold text-text-muted">
                      {deal.owner_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                    {deal.owner_name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-text-muted">Stage</dt>
                <dd className="font-medium text-foreground">
                  {STAGE_LABELS[deal.stage]}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Days in Pipeline</dt>
                <dd className="font-medium text-foreground">
                  {(() => {
                    const endDate = deal.won_date ? new Date(deal.won_date) : new Date();
                    const days = Math.floor((endDate.getTime() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    const color = days > 60 ? 'text-red-600' : days > 30 ? 'text-amber-600' : 'text-green-600';
                    return (
                      <span className={`inline-flex items-center gap-1 ${color}`}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <circle cx="8" cy="8" r="7" />
                          <path d="M8 4v4l2.5 2.5" />
                        </svg>
                        {days} {deal.won_date ? 'days (closed)' : 'days'}
                      </span>
                    );
                  })()}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Created</dt>
                <dd className="font-medium text-foreground">
                  {formatDate(deal.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Last Updated</dt>
                <dd className="font-medium text-foreground">
                  {formatDate(deal.updated_at)}
                </dd>
              </div>
              {deal.won_date && (
                <div>
                  <dt className="text-text-muted">Won Date</dt>
                  <dd className="font-medium text-green-700">
                    {formatDate(deal.won_date)}
                  </dd>
                </div>
              )}
              {deal.lost_reason && (
                <div>
                  <dt className="text-text-muted">Lost Reason</dt>
                  <dd className="font-medium text-red-700">{deal.lost_reason}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* AI Risk Assessment */}
          <DealRiskAssessment
            dealValue={deal.deal_value}
            probability={deal.probability}
            stage={deal.stage}
            createdAt={deal.created_at}
            updatedAt={deal.updated_at}
            wonDate={deal.won_date}
            expectedCloseDate={deal.expected_close_date}
            activityCount={deal.activities.length}
          />

          {/* AI Next Best Actions */}
          <DealNextAction
            stage={deal.stage}
            daysSinceUpdate={Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))}
            daysInPipeline={Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))}
            probability={deal.probability}
            activityCount={deal.activities.length}
            hasContacts={true}
            wonDate={deal.won_date}
          />
        </div>
      </div>
    </TierGate>
  );
}
