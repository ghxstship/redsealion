'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

const SCHEDULE_TYPES = [
  { value: 'build_strike', label: 'Build & Strike' },
  { value: 'run_of_show', label: 'Run of Show' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'general', label: 'General' },
];

export default function NewSchedulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    schedule_type: 'general',
    start_date: '',
    end_date: '',
    notes: '',
  });

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
          status: 'draft',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create schedule');
      toast.success('Schedule created');
      router.push(`/app/schedule/${json.schedule?.id ?? json.id}`);
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
            <label className="block text-xs font-medium text-text-muted mb-1.5">Schedule Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Main Stage Build & Strike"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Schedule Type</label>
            <select
              value={form.schedule_type}
              onChange={(e) => update('schedule_type', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => update('end_date', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Optional context or instructions…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
