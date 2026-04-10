'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface AssetDisposalModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  assetId: string;
}

const DISPOSAL_METHODS = ['sale', 'scrap', 'donate', 'transfer', 'write_off'];

export default function AssetDisposalModal({ open, onClose, onComplete, assetId }: AssetDisposalModalProps) {
  const [method, setMethod] = useState('write_off');
  const [reason, setReason] = useState('');
  const [proceeds, setProceeds] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/equipment/assets/${assetId}/dispose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          reason,
          proceeds: parseFloat(proceeds) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to dispose asset');
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
    <ModalShell open={open} onClose={onClose} title="Dispose Asset" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Disposal Method</FormLabel>
          <FormSelect required value={method} onChange={(e) => setMethod(e.target.value)}>
            {DISPOSAL_METHODS.map((m) => (
              <option key={m} value={m}>{m.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </FormSelect>
        </div>
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Beyond economical repair" />
        </div>
        {method === 'sale' && (
          <div>
            <FormLabel>Proceeds ($)</FormLabel>
            <FormInput type="number" step="0.01" min="0" value={proceeds} onChange={(e) => setProceeds(e.target.value)} placeholder="0.00" />
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting}>Confirm Disposal</Button>
        </div>
      </form>
    </ModalShell>
  );
}
