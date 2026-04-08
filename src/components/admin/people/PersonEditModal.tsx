'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface PersonEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  person: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    title: string | null;
    rate_card: string | null;
  };
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'controller', label: 'Controller' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_member', label: 'Team Member' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'crew', label: 'Crew' },
] as const;

export default function PersonEditModal({ open, onClose, onSaved, person }: PersonEditModalProps) {
  const [fullName, setFullName] = useState(person.full_name);
  const [title, setTitle] = useState(person.title ?? '');
  const [role, setRole] = useState(person.role);
  const [rateCard, setRateCard] = useState(person.rate_card ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/settings/team/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          title: title || null,
          role,
          rate_card: rateCard || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update team member');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Team Member">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Full Name *</FormLabel>
          <FormInput type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div>
          <FormLabel>Email</FormLabel>
          <FormInput type="email" disabled value={person.email} />
          <p className="mt-1 text-xs text-text-muted">Email cannot be changed after account creation.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Role</FormLabel>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Title</FormLabel>
            <FormInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Designer" />
          </div>
        </div>

        <div>
          <FormLabel>Rate Card</FormLabel>
          <FormInput type="text" value={rateCard} onChange={(e) => setRateCard(e.target.value)} placeholder="e.g. $150/hr" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
