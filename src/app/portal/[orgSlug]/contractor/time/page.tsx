'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Card from '@/components/ui/Card';
import { usePortalContext } from '@/components/portal/PortalContext';
import { toast } from 'react-hot-toast';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  booking_role: string | null;
}

export default function ContractorTimePage() {
  const { orgSlug, crewProfileId } = usePortalContext();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New entry form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const loadEntries = useCallback(async () => {
    if (!crewProfileId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/contractor/time-entries?crew_profile_id=${crewProfileId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [crewProfileId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function submitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !hours || !crewProfileId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/portal/contractor/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crew_profile_id: crewProfileId,
          date,
          hours: parseFloat(hours),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      toast.success('Time entry submitted');
      setHours('');
      setDescription('');
      loadEntries();
    } catch {
      toast.error('Failed to submit time entry');
    } finally {
      setSubmitting(false);
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Entries"
        subtitle="Track hours worked for your bookings."
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Hours</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalHours.toFixed(1)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Entries</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{entries.length}</p>
        </Card>
      </div>

      {/* Submit new entry */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-4">Log Time</h3>
        <form onSubmit={submitEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
              <FormInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Hours</label>
              <FormInput
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 8"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Description (optional)</label>
            <FormTextarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !hours}>
              {submitting ? 'Submitting...' : 'Log Entry'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Entries list */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-bg-tertiary/50" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState message="No time entries" description="Log your first time entry above." />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {entry.hours.toFixed(1)} hours
                  </p>
                  {entry.description && (
                    <p className="text-xs text-text-secondary mt-0.5">{entry.description}</p>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-xs font-medium text-text-muted uppercase">{entry.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
