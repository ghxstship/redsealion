'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface Bid {
  id: string;
  proposed_amount: number;
  proposed_start: string | null;
  proposed_end: string | null;
  status: string;
  notes: string;
  created_at: string;
  crew_profiles: {
    id: string;
    user_id: string;
    skills: string[];
    hourly_rate: number;
    users: {
      full_name: string;
      email: string;
    };
  };
}

type SortField = 'amount' | 'date' | 'status';

export default function BiddingPanel({ workOrderId }: { workOrderId: string }) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');

  useEffect(() => {
    fetchBids();
  }, [workOrderId]);

  async function fetchBids() {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/bids`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBids(json.bids || []);
    } catch (err: any) {
      setErrorMsg('Failed to load bids: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateBidStatus(bidId: string, status: string) {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg(`Bid ${status}`);
      fetchBids();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  }

  // Sort bids
  const sortedBids = [...bids].sort((a, b) => {
    if (sortBy === 'amount') return a.proposed_amount - b.proposed_amount;
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-foreground',
  };

  if (loading) return <div className="p-4 text-sm text-text-muted animate-pulse">Loading bids...</div>;
  if (bids.length === 0) return <div className="p-4 text-sm text-text-muted">No bids received yet.</div>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bids Received ({bids.length})</h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>Sort:</span>
          {(['date', 'amount', 'status'] as SortField[]).map((field) => (
            <button
              key={field}
              onClick={() => setSortBy(field)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                sortBy === field ? 'bg-foreground text-background font-medium' : 'hover:bg-bg-secondary'
              }`}
            >
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
      {successMsg && <div className="text-green-600 text-sm">{successMsg}</div>}

      <div className="overflow-x-auto -mx-4">
        <Table >
          <TableHeader >
            <TableRow>
              <TableHead className="px-4 py-2">Contractor</TableHead>
              <TableHead className="px-4 py-2">Amount</TableHead>
              <TableHead className="px-4 py-2">Proposed Dates</TableHead>
              <TableHead className="px-4 py-2">Skills</TableHead>
              <TableHead className="px-4 py-2">Rate</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Submitted</TableHead>
              <TableHead className="px-4 py-2"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {sortedBids.map((bid) => {
              const crewUser = (bid.crew_profiles as any)?.users;
              return (
                <TableRow key={bid.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <TableCell className="px-4 py-3">
                    <div className="font-medium text-foreground">{crewUser?.full_name || 'Contractor'}</div>
                    {crewUser?.email && (
                      <div className="text-xs text-text-muted">{crewUser.email}</div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-semibold text-foreground">
                    ${bid.proposed_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-text-secondary text-xs">
                    {bid.proposed_start || bid.proposed_end ? (
                      <>
                        {bid.proposed_start ? new Date(bid.proposed_start).toLocaleDateString() : '—'}
                        {' → '}
                        {bid.proposed_end ? new Date(bid.proposed_end).toLocaleDateString() : '—'}
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-text-secondary text-xs">
                    {bid.crew_profiles?.skills?.join(', ') || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-text-secondary">
                    {bid.crew_profiles?.hourly_rate ? `$${bid.crew_profiles.hourly_rate}/hr` : '—'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[bid.status] || 'bg-gray-100 text-foreground'}`}>
                      {bid.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-text-muted text-xs">
                    {new Date(bid.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {bid.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button variant="secondary" onClick={() => updateBidStatus(bid.id, 'rejected')} className="text-xs !px-2 !py-1">
                          Reject
                        </Button>
                        <Button onClick={() => updateBidStatus(bid.id, 'accepted')} className="text-xs !px-2 !py-1">
                          Accept
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Notes section */}
      {sortedBids.some(b => b.notes) && (
        <div className="border-t border-border pt-4 mt-2 space-y-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider">Bid Notes</h4>
          {sortedBids.filter(b => b.notes).map(bid => (
            <div key={bid.id} className="text-sm text-text-secondary bg-bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-medium text-foreground">{(bid.crew_profiles as any)?.users?.full_name || 'Contractor'}:</span>{' '}
              <span className="italic">&quot;{bid.notes}&quot;</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
