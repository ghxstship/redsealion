'use client';

import { useState, useEffect, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface CrewFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

export default function CrewFormModal({ open, onClose, onCreated }: CrewFormModalProps) {
  const [userId, setUserId] = useState('');
  const [skills, setSkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/settings/team')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.members)) {
          setUsers(data.members.map((m: Record<string, unknown>) => ({
            id: m.id as string, full_name: m.full_name as string, email: m.email as string,
          })));
        }
      })
      .catch(() => {});
  }, [open]);

  function resetForm() {
    setUserId(''); setSkills(''); setHourlyRate(''); setDayRate('');
    setEmergencyName(''); setEmergencyPhone(''); setNotes(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          skills: skills ? skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          day_rate: dayRate ? parseFloat(dayRate) : undefined,
          emergency_contact_name: emergencyName || undefined,
          emergency_contact_phone: emergencyPhone || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create crew profile');
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
    <ModalShell open={open} onClose={onClose} title="Add Crew Member">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Team Member</FormLabel>
          <FormSelect required value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select a team member...</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
          </FormSelect>
        </div>

        <div>
          <FormLabel>Skills</FormLabel>
          <FormInput type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Lighting, Rigging, Stage Design (comma-separated)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Hourly Rate ($)</FormLabel>
            <FormInput type="number" min={0} step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="75.00" />
          </div>
          <div>
            <FormLabel>Day Rate ($)</FormLabel>
            <FormInput type="number" min={0} step="0.01" value={dayRate} onChange={(e) => setDayRate(e.target.value)} placeholder="600.00" />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Emergency Contact</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Name</FormLabel>
              <FormInput type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
            </div>
            <div>
              <FormLabel>Phone</FormLabel>
              <FormInput type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Adding...' : 'Add Crew Member'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
