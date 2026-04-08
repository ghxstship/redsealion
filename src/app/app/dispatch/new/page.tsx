'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          location_name: locationName.trim() || undefined,
          location_address: locationAddress.trim() || undefined,
          scheduled_start: scheduledStart || undefined,
          scheduled_end: scheduledEnd || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(body.error ?? 'Failed to create work order.');
        return;
      }

      router.push('/app/dispatch');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TierGate feature="work_orders">
      <PageHeader
        title="New Work Order"
        subtitle="Create a work order and dispatch it to your crew."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="wo-title" className="block text-sm font-medium text-foreground mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="wo-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Stage build at Javits Center"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>

            <div>
              <label htmlFor="wo-desc" className="block text-sm font-medium text-foreground mb-1.5">
                Description
              </label>
              <textarea
                id="wo-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
              />
            </div>

            <div>
              <label htmlFor="wo-priority" className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <select
                id="wo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Location</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="wo-loc-name" className="block text-sm font-medium text-foreground mb-1.5">
                Venue / Site Name
              </label>
              <input
                id="wo-loc-name"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Javits Convention Center"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="wo-loc-addr" className="block text-sm font-medium text-foreground mb-1.5">
                Address
              </label>
              <input
                id="wo-loc-addr"
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="429 11th Ave, New York, NY 10001"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wo-start" className="block text-sm font-medium text-foreground mb-1.5">
                Start
              </label>
              <input
                id="wo-start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="wo-end" className="block text-sm font-medium text-foreground mb-1.5">
                End
              </label>
              <input
                id="wo-end"
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/app/dispatch')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? 'Creating...' : 'Create Work Order'}
          </Button>
        </div>
      </form>
    </TierGate>
  );
}
