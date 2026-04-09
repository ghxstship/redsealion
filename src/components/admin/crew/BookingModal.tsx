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

interface BookingModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onCreated: () => void;
}

const RATE_TYPE_OPTIONS = ['hourly', 'day', 'overtime', 'per_diem', 'travel', 'flat'] as const;

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
    setConflicts([]);

    try {
      const res = await fetch(`/api/crew/${userId}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId, venue_id: venueId || null, role,
          shift_start: shiftStart, shift_end: shiftEnd, call_time: callTime || null,
          rate_type: rateType, rate_amount: rateAmount === '' ? null : rateAmount, notes: notes || null,
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
    <ModalShell open={true} onClose={onClose} title={`Book ${userName}`} sectioned className="max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        {error && (
          <Alert>
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
          </Alert>
        )}

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
          <FormLabel>Role</FormLabel>
          <FormInput type="text" value={role} onChange={(e) => setRole(e.target.value)} required placeholder="e.g. Camera Operator" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Shift Start</FormLabel>
            <FormInput type="datetime-local" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} required />
          </div>
          <div>
            <FormLabel>Shift End</FormLabel>
            <FormInput type="datetime-local" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} required />
          </div>
        </div>

        <div>
          <FormLabel>Call Time</FormLabel>
          <FormInput type="datetime-local" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Rate Type</FormLabel>
            <FormSelect value={rateType} onChange={(e) => setRateType(e.target.value)}>
              {RATE_TYPE_OPTIONS.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Rate Amount</FormLabel>
            <FormInput type="number" step="0.01" min={0} value={rateAmount}
              onChange={(e) => setRateAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Creating...' : 'Create Booking'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
