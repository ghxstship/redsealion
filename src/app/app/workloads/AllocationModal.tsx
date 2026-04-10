'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface TeamMember { id: string; full_name: string }
interface ProposalOption { id: string; name: string }

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AllocationModal({ open, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);

  useEffect(() => {
    if (!open) return;

    // Fetch team members
    fetch('/api/crew')
      .then((r) => r.json())
      .then((body) => {
        const members = (body.crew ?? body.crew_profiles ?? body.data ?? []) as TeamMember[];
        setTeamMembers(members.map((m) => ({ id: m.id, full_name: m.full_name })));
      })
      .catch(() => {});

    // Fetch proposals
    fetch('/api/proposals')
      .then((r) => r.json())
      .then((body) => {
        const items = (body.proposals ?? body.data ?? []) as ProposalOption[];
        setProposals(items.map((p) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !startDate || !endDate) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/resources/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          proposal_id: proposalId || undefined,
          start_date: startDate,
          end_date: endDate,
          hours_per_day: parseFloat(hoursPerDay) || 8,
          role: role.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed' }));
        setError(body.error ?? 'Failed to create allocation.');
        return;
      }

      // Reset and close
      setUserId('');
      setProposalId('');
      setStartDate('');
      setEndDate('');
      setHoursPerDay('8');
      setRole('');
      setNotes('');
      onClose();
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-xl">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">New Allocation</h2>
          <p className="text-xs text-text-muted mt-1">Assign a team member to a project for a date range.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="alloc-user" className="block text-sm font-medium text-foreground mb-1.5">
              Team Member <span className="text-red-500">*</span>
            </label>
            <select
              id="alloc-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              <option value="">Select team member...</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="alloc-proposal" className="block text-sm font-medium text-foreground mb-1.5">
              Project / Proposal
            </label>
            <select
              id="alloc-proposal"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              <option value="">None</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="alloc-start" className="block text-sm font-medium text-foreground mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="alloc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="alloc-end" className="block text-sm font-medium text-foreground mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                id="alloc-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="alloc-hours" className="block text-sm font-medium text-foreground mb-1.5">
                Hours / Day
              </label>
              <input
                id="alloc-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="alloc-role" className="block text-sm font-medium text-foreground mb-1.5">
                Role
              </label>
              <input
                id="alloc-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead installer"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="alloc-notes" className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              id="alloc-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !userId || !startDate || !endDate}>
              {saving ? 'Creating...' : 'Create Allocation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
