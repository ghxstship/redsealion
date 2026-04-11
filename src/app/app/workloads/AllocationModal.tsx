'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';

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
    <ModalShell title="New Allocation" open={open} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          <div>
            <FormLabel>Team Member *</FormLabel>
            <FormSelect
              id="alloc-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Select team member...</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Project / Proposal</FormLabel>
            <FormSelect
              id="alloc-proposal"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
            >
              <option value="">None</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Start Date *</FormLabel>
              <FormInput
                id="alloc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <FormLabel>End Date *</FormLabel>
              <FormInput
                id="alloc-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Hours / Day</FormLabel>
              <FormInput
                id="alloc-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
              />
            </div>
            <div>
              <FormLabel>Role</FormLabel>
              <FormInput
                id="alloc-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead installer"
              />
            </div>
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              id="alloc-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full flex rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
    </ModalShell>
  );
}
