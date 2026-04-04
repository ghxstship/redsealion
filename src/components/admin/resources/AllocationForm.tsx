'use client';

import { useState } from 'react';

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
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="alloc-user" className="block text-xs font-medium text-text-secondary mb-1">
            Team Member
          </label>
          <select
            id="alloc-user"
            name="user_id"
            required
            className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm"
          >
            <option value="">Select…</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="alloc-role" className="block text-xs font-medium text-text-secondary mb-1">
            Role
          </label>
          <input
            id="alloc-role"
            name="role"
            type="text"
            placeholder="e.g. Lead Designer"
            className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="alloc-start" className="block text-xs font-medium text-text-secondary mb-1">
            Start Date
          </label>
          <input
            id="alloc-start"
            name="start_date"
            type="date"
            required
            defaultValue={today}
            className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="alloc-end" className="block text-xs font-medium text-text-secondary mb-1">
            End Date
          </label>
          <input
            id="alloc-end"
            name="end_date"
            type="date"
            required
            className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="alloc-hours" className="block text-xs font-medium text-text-secondary mb-1">
            Hours / Day
          </label>
          <input
            id="alloc-hours"
            name="hours_per_day"
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            defaultValue="8"
            required
            className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-sm"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
