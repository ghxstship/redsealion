'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface AllocationFormProps {
  teamMembers: Array<{ id: string; name: string }>;
  onCreated: () => void;
}

/**
 * Inline form for creating a new resource allocation.
 * Toggles between a compact "Add Allocation" button and
 * a full form with team member, date range, and hours per day.
 */
export default function AllocationForm({ teamMembers, onCreated }: AllocationFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/resources/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.get('user_id'),
          start_date: form.get('start_date'),
          end_date: form.get('end_date'),
          hours_per_day: Number(form.get('hours_per_day')),
          role: form.get('role') || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to create allocation');
        return;
      }

      setOpen(false);
      onCreated();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
        Add Allocation
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-3">
      <h4 className="text-sm font-medium text-foreground">New Allocation</h4>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <FormLabel htmlFor="alloc-user">
            Team Member
          </FormLabel>
          <FormSelect
            id="alloc-user"
            name="user_id"
            required
          >
            <option value="">Select…</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <FormLabel htmlFor="alloc-role">
            Role
          </FormLabel>
          <FormInput
            id="alloc-role"
            name="role"
            type="text"
            placeholder="e.g. Lead Designer" />
        </div>

        <div>
          <FormLabel htmlFor="alloc-start">
            Start Date
          </FormLabel>
          <FormInput
            id="alloc-start"
            name="start_date"
            type="date"
            required
            defaultValue={today} />
        </div>

        <div>
          <FormLabel htmlFor="alloc-end">
            End Date
          </FormLabel>
          <FormInput
            id="alloc-end"
            name="end_date"
            type="date"
            required />
        </div>

        <div>
          <FormLabel htmlFor="alloc-hours">
            Hours / Day
          </FormLabel>
          <FormInput
            id="alloc-hours"
            name="hours_per_day"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            defaultValue="8"
            required />
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit"
            disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
