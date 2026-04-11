'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import { toast } from 'react-hot-toast';
import { SCHEDULE_TYPES } from '@/lib/constants/schedule';

interface FormState {
  name: string;
  schedule_type: string;
  start_date: string;
  end_date: string;
  notes: string;
  event_id: string;
}

interface EventOption {
  id: string;
  name: string;
}

export default function NewSchedulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [form, setForm] = useState<FormState>({
    name: '',
    schedule_type: 'general',
    start_date: '',
    end_date: '',
    notes: '',
    event_id: '',
  });

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(() => toast.error('Failed to load events'));
  }, []);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Schedule name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/production-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          schedule_type: form.schedule_type,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          notes: form.notes.trim() || null,
          event_id: form.event_id || null,
          status: 'draft',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create schedule');
      const scheduleId = json.schedule?.id ?? json.id;
      if (!scheduleId) throw new Error('Unexpected API response');
      toast.success('Schedule created');
      router.push(`/app/schedule/${scheduleId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create schedule');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="events">
      <PageHeader title="New Production Schedule" subtitle="Create a new schedule for an event." />

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <div>
            <FormLabel>Schedule Name *</FormLabel>
            <FormInput
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Main Stage Build & Strike"
              required
            />
          </div>

          <div>
            <FormLabel>Schedule Type</FormLabel>
            <FormSelect
              value={form.schedule_type}
              onChange={(e) => update('schedule_type', e.target.value)}
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Event</FormLabel>
            <FormSelect
              value={form.event_id}
              onChange={(e) => update('event_id', e.target.value)}
            >
              <option value="">No event (standalone)</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Start Date</FormLabel>
              <FormInput
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </div>
            <div>
              <FormLabel>End Date</FormLabel>
              <FormInput
                type="date"
                value={form.end_date}
                onChange={(e) => update('end_date', e.target.value)}
              />
            </div>
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Optional context or instructions…"
              className="w-full flex rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Schedule'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </TierGate>
  );
}
