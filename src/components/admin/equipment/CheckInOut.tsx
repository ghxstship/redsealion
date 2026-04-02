'use client';

import React, { useState } from 'react';

interface CheckInOutProps {
  reservationId: string;
  currentStatus: string;
  onComplete: () => void;
}

const CONDITION_OPTIONS = ['excellent', 'good', 'fair', 'damaged'] as const;

export default function CheckInOut({ reservationId, currentStatus, onComplete }: CheckInOutProps) {
  const [condition, setCondition] = useState<string>('good');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCheckOut = currentStatus === 'reserved';
  const isCheckIn = currentStatus === 'checked_out';
  const actionLabel = isCheckOut ? 'Check Out' : isCheckIn ? 'Check In' : null;

  const handleAction = async () => {
    if (!actionLabel) return;
    setSubmitting(true);
    setError(null);

    const endpoint = isCheckOut
      ? `/api/equipment/reservations/${reservationId}/checkout`
      : `/api/equipment/reservations/${reservationId}/checkin`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition, notes: notes || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Action failed.');
      } else {
        onComplete();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor =
    currentStatus === 'reserved'
      ? 'bg-blue-100 text-blue-800'
      : currentStatus === 'checked_out'
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Equipment Status</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {currentStatus}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {actionLabel ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
              placeholder="Any condition notes..."
            />
          </div>

          <button
            onClick={handleAction}
            disabled={submitting}
            className="w-full px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : actionLabel}
          </button>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No actions available for this status.</p>
      )}
    </div>
  );
}
