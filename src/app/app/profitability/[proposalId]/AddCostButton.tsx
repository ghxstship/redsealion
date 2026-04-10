'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';

interface AddCostButtonProps {
  proposalId: string;
}

export default function AddCostButton({ proposalId }: AddCostButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/project-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          category: formData.get('category'),
          description: formData.get('description') || null,
          amount: parseFloat(formData.get('amount') as string),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to add cost.');
        setSaving(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Add Cost</Button>

      <ModalShell title="Add Project Cost" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <FormLabel>Category *</FormLabel>
            <FormSelect name="category" required>
              <option value="">Select category...</option>
              <option value="labor">Labor</option>
              <option value="materials">Materials</option>
              <option value="equipment">Equipment</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="travel">Travel</option>
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="permits">Permits & Insurance</option>
              <option value="other">Other</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Amount *</FormLabel>
            <FormInput name="amount" type="number" step="0.01" min="0" required placeholder="0.00" />
          </div>
          <div>
            <FormLabel>Description</FormLabel>
            <FormInput name="description" placeholder="Brief description of this cost" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Cost'}</Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
