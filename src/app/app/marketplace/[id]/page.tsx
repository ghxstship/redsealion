'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function MarketplaceJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [wo, setWo] = useState<any>(null);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [proposedStart, setProposedStart] = useState('');
  const [proposedEnd, setProposedEnd] = useState('');
  
  // Edit mode for existing bids
  const [editingBid, setEditingBid] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Use the API route for proper org isolation and permission checking
      const res = await fetch(`/api/work-orders/${id}`);
      if (!res.ok) throw new Error('Work order not found or you do not have access.');
      
      const body = await res.json();
      const workOrder = body.work_order;
      
      // Verify this is a public board item and not soft-deleted
      if (!workOrder.is_public_board || workOrder.deleted_at) {
        throw new Error('This work order is not available on the marketplace.');
      }
      
      setWo(workOrder);

      // Fetch existing bid via the bids API
      const bidsRes = await fetch(`/api/work-orders/${id}/bids`);
      if (bidsRes.ok) {
        const bidsBody = await bidsRes.json();
        const bids = bidsBody.bids || [];
        
        // Find current user's bid — we need to check via auth
        // The API returns all bids for the work order; we find ours
        // Note: the bid submission endpoint identifies the user, so we check all bids
        // and let the form handle new submissions via the upsert endpoint
        if (bids.length > 0) {
          // Try to find our own bid by checking the response
          // For now, try fetching via client-side auth check
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: userAuth } = await supabase.auth.getUser();
          
          if (userAuth.user) {
            const { data: crew } = await supabase
              .from('crew_profiles')
              .select('id')
              .eq('user_id', userAuth.user.id)
              .single();
            
            if (crew) {
              const myBid = bids.find((b: any) => {
                const crewId = b.crew_profile_id || (b.crew_profiles as any)?.id;
                return crewId === crew.id;
              });
              
              if (myBid) {
                setExistingBid(myBid);
                setAmount(myBid.proposed_amount?.toString() || '');
                setNotes(myBid.notes || '');
                setProposedStart(myBid.proposed_start || '');
                setProposedEnd(myBid.proposed_end || '');
              }
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submitBid(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // Prevent double-submit
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/work-orders/${id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposed_amount: parseFloat(amount),
          proposed_start: proposedStart || undefined,
          proposed_end: proposedEnd || undefined,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit bid.');
      
      toast.success(existingBid ? 'Bid updated successfully!' : 'Bid submitted successfully!');
      setEditingBid(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function withdrawBid() {
    if (!existingBid || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/work-orders/${id}/bids/${existingBid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'withdrawn' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw bid.');
      
      toast.success('Bid withdrawn.');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-48 rounded bg-zinc-200" />
        <div className="h-4 w-72 rounded bg-zinc-100" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 rounded-xl bg-zinc-100" />
          <div className="h-64 rounded-xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (errorMsg && !wo) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-lg mx-auto">
          <p className="text-red-700 font-medium mb-4">{errorMsg}</p>
          <Link href="/app/marketplace" className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const deadlinePassed = wo?.bidding_deadline && new Date() > new Date(wo.bidding_deadline);
  const inputClass = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:border-foreground/30";
  const canSubmitNewBid = !existingBid || existingBid.status === 'withdrawn';
  const canEditBid = existingBid && existingBid.status === 'pending';

  // Build the bid form (reused for new bids, edits, and resubmissions)
  function renderBidForm(isResubmit: boolean = false) {
    return (
      <form onSubmit={submitBid} className={`space-y-4 ${isResubmit ? 'border-t border-border pt-4 mt-4' : ''}`}>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Proposed Amount ($)</label>
          <input 
            type="number" 
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            placeholder="e.g. 5000"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Proposed Start (Optional)</label>
            <input
              type="datetime-local"
              value={proposedStart}
              onChange={(e) => setProposedStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Proposed End (Optional)</label>
            <input
              type="datetime-local"
              value={proposedEnd}
              onChange={(e) => setProposedEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Notes / Terms (Optional)</label>
          <textarea 
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass + " resize-none"}
            placeholder="Any conditions or timeline constraints..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {editingBid && (
            <Button variant="secondary" onClick={() => setEditingBid(false)} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting || !amount}>
            {submitting
              ? 'Submitting...'
              : editingBid
                ? 'Update Bid'
                : isResubmit
                  ? 'Resubmit Bid'
                  : 'Submit Bid'}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <PageHeader 
        title={wo.title} 
        subtitle={wo.wo_number + (wo.location_name ? ` • ${wo.location_name}` : '')}
      >
        <Link 
          href="/app/marketplace" 
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
              <dd>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  wo.priority === 'urgent' ? 'bg-red-50 text-red-700' :
                  wo.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                  wo.priority === 'medium' ? 'bg-blue-50 text-blue-700' :
                  'bg-bg-secondary text-text-muted'
                }`}>
                  {wo.priority?.charAt(0).toUpperCase() + wo.priority?.slice(1)}
                </span>
              </dd>
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
            {wo.location_address && (
              <div>
                <dt className="text-text-muted mb-1">Address</dt>
                <dd className="text-foreground">{wo.location_address}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4">Your Proposal</h3>
          
          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {errorMsg}
            </div>
          )}

          {existingBid && !editingBid ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      existingBid.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                      existingBid.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      existingBid.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {existingBid.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Amount</p>
                    <p className="font-semibold">${existingBid.proposed_amount}</p>
                  </div>
                </div>
                {(existingBid.proposed_start || existingBid.proposed_end) && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-text-muted mb-1">Proposed Schedule</p>
                    <p className="text-sm">
                      {existingBid.proposed_start ? new Date(existingBid.proposed_start).toLocaleDateString() : '—'}
                      {' → '}
                      {existingBid.proposed_end ? new Date(existingBid.proposed_end).toLocaleDateString() : '—'}
                    </p>
                  </div>
                )}
                {existingBid.notes && (
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs text-text-muted mb-1">Notes</p>
                    <p className="text-sm">{existingBid.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions for pending bids */}
              {existingBid.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-2">
                  {!deadlinePassed && (
                    <Button variant="secondary" onClick={() => setEditingBid(true)} disabled={submitting}>
                      Edit Bid
                    </Button>
                  )}
                  <Button variant="secondary" onClick={withdrawBid} disabled={submitting}>
                    {submitting ? 'Withdrawing...' : 'Withdraw Bid'}
                  </Button>
                </div>
              )}
              
              {/* Resubmit form for withdrawn bids */}
              {existingBid.status === 'withdrawn' && !deadlinePassed && (
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm text-text-secondary mb-4">You have withdrawn your bid. You can resubmit below.</p>
                  {renderBidForm(true)}
                </div>
              )}
            </div>
          ) : editingBid ? (
            // Edit mode for pending bid
            renderBidForm(false)
          ) : deadlinePassed ? (
            <div className="py-8 text-center text-red-600 text-sm font-medium">
              The bidding deadline has passed.
            </div>
          ) : canSubmitNewBid ? (
            renderBidForm(false)
          ) : null}
        </Card>
      </div>
    </>
  );
}
