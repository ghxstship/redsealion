'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormLabel from '@/components/ui/FormLabel';

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

    const action = isCheckOut ? 'check_out' : 'check_in';
    const endpoint = '/api/equipment/check-in-out';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId, action, condition, notes: notes || null }),
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
        : 'bg-bg-secondary text-foreground';

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Equipment Status</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {currentStatus}
        </span>
      </div>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      {actionLabel ? (
        <div className="space-y-4">
          <div>
            <FormLabel>Condition</FormLabel>
            <FormSelect
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any condition notes..." />
          </div>

          <Button className="w-full" onClick={handleAction}
            disabled={submitting}>
            {submitting ? 'Processing...' : actionLabel}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No actions available for this status.</p>
      )}
    </div>
  );
}
