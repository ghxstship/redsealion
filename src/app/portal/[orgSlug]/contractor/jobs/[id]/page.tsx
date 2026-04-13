'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import StatusBadge, { TASK_PRIORITY_COLORS, BID_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { usePortalContext } from '@/components/portal/PortalContext';
import { toast } from 'react-hot-toast';

interface WorkOrderDetail {
  id: string;
  title: string;
  wo_number: string;
  description: string | null;
  priority: string;
  budget_range: string | null;
  bidding_deadline: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  location_name: string | null;
  location_address: string | null;
}

interface BidRecord {
  id: string;
  proposed_amount: number;
  notes: string | null;
  status: string;
}

export default function ContractorJobDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = use(params);
  const { crewProfileId } = usePortalContext();

  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [existingBid, setExistingBid] = useState<BidRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${id}`);
      if (!res.ok) throw new Error('Work order not found.');
      const body = await res.json();
      const workOrder = body.work_order;

      if (!workOrder.is_public_board || workOrder.deleted_at) {
        throw new Error('This job is not available.');
      }

      setWo(workOrder);

      // Check for existing bid
      if (crewProfileId) {
        const bidsRes = await fetch(`/api/work-orders/${id}/bids`);
        if (bidsRes.ok) {
          const bidsBody = await bidsRes.json();
          const bids = bidsBody.bids || [];
          const myBid = bids.find((b: Record<string, unknown>) => {
            return (b.crew_profile_id as string) === crewProfileId;
          });
          if (myBid) {
            setExistingBid(myBid);
            setAmount(myBid.proposed_amount?.toString() || '');
            setNotes(myBid.notes || '');
          }
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, crewProfileId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/work-orders/${id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposed_amount: parseFloat(amount),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit bid.');
      toast.success(existingBid ? 'Bid updated!' : 'Bid submitted!');
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-48 rounded bg-bg-secondary" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-xl bg-bg-tertiary/50" />
          <div className="h-64 rounded-xl bg-bg-tertiary/50" />
        </div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="p-8">
        <Alert variant="error" className="text-center max-w-lg mx-auto">
          <p className="font-medium mb-4">{errorMsg || 'Job not found.'}</p>
          <Link href={`/portal/${orgSlug}/contractor/jobs`} className="text-sm font-medium text-emerald-600 hover:underline">
            ← Back to Jobs
          </Link>
        </Alert>
      </div>
    );
  }

  const deadlinePassed = wo.bidding_deadline && new Date() > new Date(wo.bidding_deadline);

  return (
    <div className="space-y-6">
      <PageHeader
        title={wo.title}
        subtitle={wo.wo_number + (wo.location_name ? ` • ${wo.location_name}` : '')}
      >
        <Link
          href={`/portal/${orgSlug}/contractor/jobs`}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-bg-secondary"
        >
          Back
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold mb-4">Job Details</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-text-muted mb-1">Description</dt>
              <dd className="text-foreground whitespace-pre-wrap">{wo.description || 'No description provided.'}</dd>
            </div>
            {wo.budget_range && (
              <div>
                <dt className="text-text-muted mb-1">Budget Range</dt>
                <dd className="text-foreground font-medium">{wo.budget_range}</dd>
              </div>
            )}
            <div>
              <dt className="text-text-muted mb-1">Priority</dt>
              <dd><StatusBadge status={wo.priority} colorMap={TASK_PRIORITY_COLORS} /></dd>
            </div>
            <div>
              <dt className="text-text-muted mb-1">Bidding Deadline</dt>
              <dd className={`font-medium ${deadlinePassed ? 'text-red-600' : 'text-foreground'}`}>
                {wo.bidding_deadline ? new Date(wo.bidding_deadline).toLocaleString() : 'No deadline'}
              </dd>
            </div>
            {wo.scheduled_start && (
              <div>
                <dt className="text-text-muted mb-1">Scheduled Dates</dt>
                <dd className="text-foreground">
                  {new Date(wo.scheduled_start).toLocaleDateString()}
                  {wo.scheduled_end ? ` – ${new Date(wo.scheduled_end).toLocaleDateString()}` : ''}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4">Your Proposal</h3>

          {errorMsg && <Alert variant="error" className="mb-6">{errorMsg}</Alert>}

          {existingBid ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-text-muted uppercase mb-1">Status</p>
                    <StatusBadge status={existingBid.status} colorMap={BID_STATUS_COLORS} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase mb-1">Amount</p>
                    <p className="font-semibold">${existingBid.proposed_amount.toLocaleString()}</p>
                  </div>
                </div>
                {existingBid.notes && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-text-muted mb-1">Notes</p>
                    <p className="text-sm">{existingBid.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : deadlinePassed ? (
            <div className="py-8 text-center text-red-600 text-sm font-medium">
              The bidding deadline has passed.
            </div>
          ) : (
            <form onSubmit={submitBid} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Proposed Amount ($)</label>
                <FormInput
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Notes (optional)</label>
                <FormTextarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Terms, timeline constraints..."
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || !amount}>
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
