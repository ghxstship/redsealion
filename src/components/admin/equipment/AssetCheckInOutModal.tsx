'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface AssetCheckInOutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  action: 'check_out' | 'check_in';
  assets: { id: string; name: string }[];
}

const CONDITION_OPTIONS = ['new', 'good', 'fair', 'damaged', 'lost'];

export default function AssetCheckInOutModal({ open, onClose, onComplete, action, assets }: AssetCheckInOutModalProps) {
  const [assetId, setAssetId] = useState('');
  const [condition, setCondition] = useState('good');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOut = action === 'check_out';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetId) {
      setError('Please select an asset.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/equipment/check-in-out/standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          asset_id: assetId,
          condition,
          destination: isOut ? destination : undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isOut ? 'check out' : 'check in'}`);
      }
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title={isOut ? 'Check Out Asset' : 'Check In Asset'} size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Asset</FormLabel>
          <FormSelect required value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            <option value="">Select an asset...</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </FormSelect>
        </div>
        {isOut && (
          <div>
            <FormLabel>Destination (Optional)</FormLabel>
            <FormInput type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Warehouse B" />
          </div>
        )}
        <div>
          <FormLabel>Condition</FormLabel>
          <FormSelect value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITION_OPTIONS.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any condition notes..." />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{isOut ? 'Check Out' : 'Check In'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
