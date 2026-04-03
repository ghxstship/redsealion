'use client';

import React, { useState, useEffect } from 'react';

interface Proposal {
  id: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
}

interface BookingModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onCreated: () => void;
}

const RATE_TYPE_OPTIONS = ['hourly', 'daily', 'flat', 'overtime'] as const;

export default function BookingModal({ userId, userName, onClose, onCreated }: BookingModalProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [proposalId, setProposalId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [role, setRole] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [callTime, setCallTime] = useState('');
  const [rateType, setRateType] = useState<string>(RATE_TYPE_OPTIONS[0]);
  const [rateAmount, setRateAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ proposalName: string; venueName: string; shiftStart: string; shiftEnd: string }>>([]);

  useEffect(() => {
    fetch('/api/proposals?status=active')
      .then((r) => r.json())
      .then((data) => setProposals(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!proposalId) {
      setVenues([]);
      return;
    }
    fetch(`/api/proposals/${proposalId}/venues`)
      .then((r) => r.json())
      .then((data) => setVenues(data))
      .catch(() => {});
  }, [proposalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setConflicts([]);

    try {
      const res = await fetch(`/api/crew/${userId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          venue_id: venueId || null,
          role,
          shift_start: shiftStart,
          shift_end: shiftEnd,
          call_time: callTime || null,
          rate_type: rateType,
          rate_amount: rateAmount === '' ? null : rateAmount,
          notes: notes || null,
        }),
      });

      if (res.status === 409) {
        const body = await res.json();
        setConflicts(body.conflicts ?? []);
        setError('Booking conflicts with existing assignments.');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to create booking.');
      } else {
        onCreated();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative bg-white border border-border rounded-lg shadow-sm w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-modal-content">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Book {userName}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              <p>{error}</p>
              {conflicts.length > 0 && (
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {conflicts.map((c, i) => (
                    <li key={i}>
                      {c.proposalName} at {c.venueName}: {new Date(c.shiftStart).toLocaleString()} &ndash;{' '}
                      {new Date(c.shiftEnd).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Proposal</label>
            <select
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
            >
              <option value="">Select proposal</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Venue</label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              disabled={!proposalId}
            >
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              placeholder="e.g. Camera Operator"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Shift Start</label>
              <input
                type="datetime-local"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Shift End</label>
              <input
                type="datetime-local"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Call Time</label>
            <input
              type="datetime-local"
              value={callTime}
              onChange={(e) => setCallTime(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Rate Type</label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
              >
                {RATE_TYPE_OPTIONS.map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Rate Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rateAmount}
                onChange={(e) => setRateAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-bg-secondary text-foreground hover:bg-bg-tertiary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
