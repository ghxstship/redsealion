'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface CostRateFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

const ROLES = ['collaborator', 'contractor', 'crew'] as const;

export default function CostRateFormModal({ open, onClose, onCreated }: CostRateFormModalProps) {
  const [role, setRole] = useState('');
  const [hourlyCost, setHourlyCost] = useState('');
  const [hourlyBillable, setHourlyBillable] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setRole(''); setHourlyCost(''); setHourlyBillable(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/cost-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, hourly_cost: parseFloat(hourlyCost), hourly_billable: parseFloat(hourlyBillable) }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add rate'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add Cost Rate" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Role</FormLabel>
          <FormSelect required value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select role...</option>
            {ROLES.map((r) => <option key={r} value={r}>{r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
          </FormSelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Cost Rate ($/hr)</FormLabel>
            <FormInput type="number" required min={0} step="0.01" value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <FormLabel>Bill Rate ($/hr)</FormLabel>
            <FormInput type="number" required min={0} step="0.01" value={hourlyBillable} onChange={(e) => setHourlyBillable(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Adding...' : 'Add Rate'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
