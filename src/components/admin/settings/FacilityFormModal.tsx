'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface FacilityFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function FacilityFormModal({ open, onClose, onCreated }: FacilityFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('warehouse');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setName(''); setType('warehouse'); setStreet(''); setCity(''); setState(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, address: { street, city, state } }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add facility'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add Facility" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Facility Name</FormLabel>
            <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse A" />
          </div>
          <div>
            <FormLabel>Type</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              <option value="warehouse">Warehouse</option>
              <option value="office">Office</option>
              <option value="studio">Studio</option>
              <option value="storage">Storage</option>
            </FormSelect>
          </div>
        </div>
        <div>
          <FormLabel>Street</FormLabel>
          <FormInput type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>City</FormLabel>
            <FormInput type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
          </div>
          <div>
            <FormLabel>State</FormLabel>
            <FormInput type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Adding...' : 'Add Facility'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
