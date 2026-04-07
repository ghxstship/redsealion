'use client';

import { useState, type FormEvent, useEffect } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface ActivationFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface SelectOption {
  id: string;
  name: string;
}

const ACTIVATION_TYPES = [
  'stage', 'booth', 'hospitality', 'installation', 'catering',
  'vip_area', 'green_room', 'backstage', 'merchandise',
  'experiential', 'broadcast', 'signage', 'general', 'other',
] as const;

const ACTIVATION_STATUSES = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;

function formatLabel(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function ActivationFormModal({ open, onClose, onCreated }: ActivationFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('general');
  const [status, setStatus] = useState<string>('draft');
  const [eventId, setEventId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [notes, setNotes] = useState('');

  const [events, setEvents] = useState<SelectOption[]>([]);
  const [locations, setLocations] = useState<SelectOption[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events and locations for dropdowns
  useEffect(() => {
    if (!open) return;

    async function loadOptions() {
      try {
        const [eventsRes, locationsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/locations'),
        ]);
        if (eventsRes.ok) {
          const data = await eventsRes.json();
          setEvents((data.events ?? []).map((e: Record<string, unknown>) => ({ id: e.id as string, name: e.name as string })));
        }
        if (locationsRes.ok) {
          const data = await locationsRes.json();
          setLocations((data.locations ?? []).map((l: Record<string, unknown>) => ({ id: l.id as string, name: l.name as string })));
        }
      } catch {
        // Silently fail — user can retry
      }
    }
    loadOptions();
  }, [open]);

  function resetForm() {
    setName(''); setType('general'); setStatus('draft');
    setEventId(''); setLocationId('');
    setStartsAt(''); setEndsAt(''); setNotes('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!eventId) { setError('Please select an event'); setSubmitting(false); return; }
    if (!locationId) { setError('Please select a location'); setSubmitting(false); return; }

    try {
      const res = await fetch('/api/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          status,
          event_id: eventId,
          location_id: locationId,
          starts_at: startsAt || null,
          ends_at: endsAt || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create activation');
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
    <ModalShell open={open} onClose={onClose} title="Add Activation" size="xl">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Activation Name *</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP Hospitality Suite" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Event *</FormLabel>
            <FormSelect value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              <option value="">Select event...</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Location *</FormLabel>
            <FormSelect value={locationId} onChange={(e) => setLocationId(e.target.value)} required>
              <option value="">Select location...</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </FormSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Type</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {ACTIVATION_TYPES.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {ACTIVATION_STATUSES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
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

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional details..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Add Activation'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
