'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onCreated: () => void;
}

export default function AddContactModal({ open, onClose, clientId, onCreated }: AddContactModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('primary');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          role,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add contact');
      }

      setFirstName(''); setLastName(''); setEmail('');
      setPhone(''); setRole('primary'); setError(null);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add Contact" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>First Name *</FormLabel>
            <FormInput type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <FormLabel>Last Name</FormLabel>
            <FormInput type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <FormLabel>Email *</FormLabel>
          <FormInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Phone</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FormLabel>Role</FormLabel>
            <FormSelect value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="primary">Primary</option>
              <option value="billing">Billing</option>
              <option value="creative">Creative</option>
              <option value="operations">Operations</option>
            </FormSelect>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
