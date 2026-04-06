'use client';

import React, { useState, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Proposal { id: string; name: string; }
interface Venue { id: string; name: string; }

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
    if (!proposalId) { setVenues([]); return; }
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
          asset_id: assetId, proposal_id: proposalId, venue_id: venueId || null,
          quantity, reserved_from: dateFrom, reserved_until: dateTo, notes: notes || null,
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
    <ModalShell open={true} onClose={onClose} title={`Reserve: ${assetName}`} size="md" sectioned>
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {error && <Alert>{error}</Alert>}

        <div>
          <FormLabel>Proposal</FormLabel>
          <FormSelect value={proposalId} onChange={(e) => setProposalId(e.target.value)} required>
            <option value="">Select proposal</option>
            {proposals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </FormSelect>
        </div>

        <div>
          <FormLabel>Venue</FormLabel>
          <FormSelect value={venueId} onChange={(e) => setVenueId(e.target.value)} disabled={!proposalId}>
            <option value="">Select venue</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </FormSelect>
        </div>

        <div>
          <FormLabel>Quantity</FormLabel>
          <FormInput type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>From</FormLabel>
            <FormInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required />
          </div>
          <div>
            <FormLabel>To</FormLabel>
            <FormInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required />
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Reserving...' : 'Reserve'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
