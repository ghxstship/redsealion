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

interface ReservationModalProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function ReservationModal({ assetId, assetName, onClose, onCreated }: ReservationModalProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [proposalId, setProposalId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const res = await fetch('/api/equipment/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          proposal_id: proposalId,
          venue_id: venueId || null,
          quantity,
          reserved_from: dateFrom,
          reserved_until: dateTo,
          notes: notes || null,
        }),
      });

      if (res.status === 409) {
        const body = await res.json();
        setError(body.message ?? 'Equipment is not available for the selected dates.');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to create reservation.');
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
      <div className="relative bg-white border border-border rounded-lg shadow-sm w-full max-w-md mx-4 animate-modal-content">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Reserve: {assetName}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
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
              disabled={!proposalId}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white text-foreground"
            >
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              {submitting ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
