'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface BundleFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function BundleFormModal({ open, onClose, onCreated }: BundleFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setName(''); setDescription(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/equipment/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined, items: [] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create bundle');
      }
      resetForm(); onCreated(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Create Bundle" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Bundle Name</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Festival Stage Kit" />
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description..." />
        </div>
        <p className="text-xs text-text-muted">You can add equipment items to this bundle after creation.</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Creating...' : 'Create Bundle'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
