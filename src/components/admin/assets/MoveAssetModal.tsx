'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface MoveAssetModalProps {
  open: boolean;
  onClose: () => void;
  onMoved: () => void;
  asset: {
    id: string;
    name: string;
  };
}

export default function MoveAssetModal({ open, onClose, onMoved, asset }: MoveAssetModalProps) {
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_location: {
            name: locationName,
            address: address || undefined,
            notes: notes || undefined,
            moved_at: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to move asset');
      }

      onMoved();
      onClose();
      setLocationName('');
      setAddress('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Move Asset" subtitle={asset.name}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Destination *</FormLabel>
          <FormInput
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Warehouse B, Event Site, Client Office"
          />
        </div>

        <div>
          <FormLabel>Address</FormLabel>
          <FormInput
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address (optional)"
          />
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Reason for move, handling instructions, etc."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Moving...' : 'Confirm Move'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
