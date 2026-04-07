'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_TYPES = [
  'festival', 'conference', 'corporate', 'concert', 'sports',
  'ceremony', 'broadcast', 'exhibition', 'tour', 'gala',
  'wedding', 'production', 'other',
] as const;

const EVENT_STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

function formatLabel(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function EventFormModal({ open, onClose, onCreated }: EventFormModalProps) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<string>('production');
  const [status, setStatus] = useState<string>('draft');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [dailyHours, setDailyHours] = useState('');
  const [doorsTime, setDoorsTime] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [presenter, setPresenter] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName(''); setSubtitle(''); setType('production'); setStatus('draft');
    setStartsAt(''); setEndsAt(''); setDailyHours(''); setDoorsTime('');
    setGeneralEmail(''); setPresenter(''); setEventCode(''); setNotes('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subtitle: subtitle || null,
          type,
          status,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          daily_hours: dailyHours || null,
          doors_time: doorsTime || null,
          general_email: generalEmail || null,
          presenter: presenter || null,
          event_code: eventCode || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create event');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add Event" size="xl">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Event Name *</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Opening Ceremony" />
        </div>

        <div>
          <FormLabel>Subtitle</FormLabel>
          <FormInput type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g. Day 1 — Main Arena" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Type</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {EVENT_STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </FormSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Start Date</FormLabel>
            <FormInput type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <FormLabel>End Date</FormLabel>
            <FormInput type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Doors Time</FormLabel>
            <FormInput type="text" value={doorsTime} onChange={(e) => setDoorsTime(e.target.value)} placeholder="e.g. 6:00 PM" />
          </div>
          <div>
            <FormLabel>Daily Hours</FormLabel>
            <FormInput type="text" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} placeholder="e.g. 8:00 AM – 6:00 PM" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Event Code</FormLabel>
            <FormInput type="text" value={eventCode} onChange={(e) => setEventCode(e.target.value)} placeholder="e.g. OC-2026" />
          </div>
          <div>
            <FormLabel>Presenter</FormLabel>
            <FormInput type="text" value={presenter} onChange={(e) => setPresenter(e.target.value)} placeholder="e.g. Live Nation" />
          </div>
        </div>

        <div>
          <FormLabel>Contact Email</FormLabel>
          <FormInput type="email" value={generalEmail} onChange={(e) => setGeneralEmail(e.target.value)} placeholder="e.g. production@event.com" />
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional details..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Add Event'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
