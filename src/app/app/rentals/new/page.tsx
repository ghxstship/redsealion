'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';

interface ClientOption { id: string; company_name: string }
interface EventOption { id: string; name: string }

export default function NewRentalOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState('');
  const [eventId, setEventId] = useState('');
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [depositCents, setDepositCents] = useState('');
  const [notes, setNotes] = useState('');

  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);

  useEffect(() => {
    fetch('/api/clients')
      .then((res) => res.json())
      .then((body) => {
        const clients = (body.clients ?? body.data ?? []) as ClientOption[];
        setClientOptions(clients);
      })
      .catch(() => {});

    fetch('/api/events')
      .then((res) => res.json())
      .then((body) => {
        const events = (body.events ?? []) as EventOption[];
        setEventOptions(events);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rentalStart || !rentalEnd) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/rentals/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || undefined,
          event_id: eventId || undefined,
          rental_start: rentalStart,
          rental_end: rentalEnd,
          deposit_cents: depositCents ? Math.round(parseFloat(depositCents) * 100) : 0,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(body.error ?? 'Failed to create rental order.');
        return;
      }

      router.push('/app/rentals');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TierGate feature="equipment">
      <PageHeader
        title="New Rental Order"
        subtitle="Create a new equipment rental order."
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Rental Details</h2>
          <div className="space-y-4">
            {clientOptions.length > 0 && (
              <div>
                <FormLabel htmlFor="rnt-client">Client</FormLabel>
                <FormSelect
                  id="rnt-client"
                  value={clientId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClientId(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </FormSelect>
              </div>
            )}

            {eventOptions.length > 0 && (
              <div>
                <FormLabel htmlFor="rnt-event">Event</FormLabel>
                <FormSelect
                  id="rnt-event"
                  value={eventId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEventId(e.target.value)}
                >
                  <option value="">Select an event...</option>
                  {eventOptions.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </FormSelect>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Rental Period</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="rnt-start">
                Start Date <span className="text-red-500">*</span>
              </FormLabel>
              <FormInput
                id="rnt-start"
                type="date"
                value={rentalStart}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRentalStart(e.target.value)}
                required
              />
            </div>
            <div>
              <FormLabel htmlFor="rnt-end">
                End Date <span className="text-red-500">*</span>
              </FormLabel>
              <FormInput
                id="rnt-end"
                type="date"
                value={rentalEnd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRentalEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Financial</h2>
          <div>
            <FormLabel htmlFor="rnt-deposit">Deposit Amount ($)</FormLabel>
            <FormInput
              id="rnt-deposit"
              type="number"
              step="0.01"
              min="0"
              value={depositCents}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositCents(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Notes</h2>
          <textarea
            id="rnt-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or notes..."
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/app/rentals')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !rentalStart || !rentalEnd}>
            {saving ? 'Creating...' : 'Create Rental Order'}
          </Button>
        </div>
      </form>
    </TierGate>
  );
}
