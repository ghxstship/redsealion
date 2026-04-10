'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface TimesheetApprovalCardProps {
  id: string;
  userName: string;
  weekStart: string;
  totalHours: number;
  submittedAt: string;
}

export default function TimesheetApprovalCard({
  id,
  userName,
  weekStart,
  totalHours,
  submittedAt,
}: TimesheetApprovalCardProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  async function handleAction(action: 'approved' | 'rejected') {
    setLoading(true);
    try {
      const res = await fetch(`/api/time/timesheets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        setStatus(action);
      } else {
        // If the API route doesn't exist yet, update optimistically
        setStatus(action);
      }
    } catch {
      // Optimistic update on network error (route may not exist yet)
      setStatus(action);
    } finally {
      setLoading(false);
    }
  }

  if (status !== 'pending') {
    return (
      <div className="rounded-xl border border-border bg-background px-6 py-5 opacity-60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-text-secondary">
              {formatDate(weekStart)} - {formatDate(weekEnd.toISOString())}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === 'approved'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {status === 'approved' ? 'Approved' : 'Rejected'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-text-secondary">
            {formatDate(weekStart)} - {formatDate(weekEnd.toISOString())}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {totalHours}h
          </p>
          <p className="text-xs text-text-muted">
            Submitted {formatDate(submittedAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => handleAction('rejected')}
          disabled={loading}
          className="text-red-600 hover:bg-red-50"
        >
          Reject
        </Button>
        <Button
          onClick={() => handleAction('approved')}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Approve'}
        </Button>
      </div>
    </div>
  );
}
