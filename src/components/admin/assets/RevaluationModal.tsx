'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface RevaluationModalProps {
  open: boolean;
  onClose: () => void;
  onRevalued: () => void;
  asset: {
    id: string;
    name: string;
    currentValue: number;
  };
}

export default function RevaluationModal({ open, onClose, onRevalued, asset }: RevaluationModalProps) {
  const [newValue, setNewValue] = useState(String(asset.currentValue));
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newValueNum = parseFloat(newValue) || 0;
  const delta = newValueNum - asset.currentValue;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${asset.id}/revalue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_value: newValueNum,
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to revalue asset');
      }

      onRevalued();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Revalue Asset" subtitle={asset.name}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Current Value</FormLabel>
            <FormInput
              type="text"
              disabled
              value={`$${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            />
          </div>
          <div>
            <FormLabel>New Value *</FormLabel>
            <FormInput
              type="number"
              required
              min="0"
              step="0.01"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Delta preview */}
        {delta !== 0 && (
          <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{delta > 0 ? 'Revaluation (increase)' : 'Impairment (decrease)'}</span>
              <span className={`font-semibold tabular-nums ${delta > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {delta > 0 ? '+' : ''}${delta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div>
          <FormLabel>Reason *</FormLabel>
          <FormTextarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Market appraisal, condition assessment, etc."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : 'Apply Revaluation'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
