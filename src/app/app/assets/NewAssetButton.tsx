'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function NewAssetButton() {
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
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          type: formData.get('type'),
          status: formData.get('status'),
          condition: formData.get('condition'),
          current_value: formData.get('current_value') ? parseFloat(formData.get('current_value') as string) : null,
          current_location: formData.get('current_location') || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to create asset.');
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
      <Button onClick={() => setOpen(true)}>New Asset</Button>

      <ModalShell title="New Asset" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}
          <div>
            <FormLabel>Name *</FormLabel>
            <FormInput name="name" required placeholder="e.g., LED Wall Panel #12" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Type *</FormLabel>
              <FormSelect name="type" required>
                <option value="fabrication">Fabrication</option>
                <option value="equipment">Equipment</option>
                <option value="technology">Technology</option>
                <option value="furniture">Furniture</option>
                <option value="signage">Signage</option>
                <option value="other">Other</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Status</FormLabel>
              <FormSelect name="status" defaultValue="in_storage">
                <option value="in_storage">In Storage</option>
                <option value="deployed">Deployed</option>
                <option value="in_production">In Production</option>
                <option value="in_transit">In Transit</option>
                <option value="decommissioned">Decommissioned</option>
              </FormSelect>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Condition</FormLabel>
              <FormSelect name="condition" defaultValue="good">
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Current Value</FormLabel>
              <FormInput name="current_value" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>
          <div>
            <FormLabel>Current Location</FormLabel>
            <FormInput name="current_location" placeholder="e.g., Warehouse A, Shelf B3" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Asset'}</Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
