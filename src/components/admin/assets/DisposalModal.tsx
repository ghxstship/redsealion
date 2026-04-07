'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface DisposalModalProps {
  open: boolean;
  onClose: () => void;
  onDisposed: () => void;
  asset: {
    id: string;
    name: string;
    currentValue: number;
    status: string;
  };
}

const DISPOSAL_METHODS = [
  { value: 'sale', label: 'Sale — Sell to buyer' },
  { value: 'scrap', label: 'Scrap — Decommission & recycle' },
  { value: 'donate', label: 'Donate — Transfer at no cost' },
  { value: 'transfer', label: 'Transfer — Assign to client' },
  { value: 'write_off', label: 'Write Off — Write down to zero' },
] as const;

export default function DisposalModal({ open, onClose, onDisposed, asset }: DisposalModalProps) {
  const [method, setMethod] = useState('');
  const [reason, setReason] = useState('');
  const [proceeds, setProceeds] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proceedsNum = parseFloat(proceeds) || 0;
  const profitLoss = proceedsNum - asset.currentValue;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/assets/${asset.id}/dispose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposal_method: method,
          disposal_reason: reason,
          disposal_proceeds: proceedsNum,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to dispose asset');
      }

      onDisposed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Dispose Asset" subtitle={asset.name}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Disposal Method *</FormLabel>
          <FormSelect required value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Select method...</option>
            {DISPOSAL_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </FormSelect>
        </div>

        <div>
          <FormLabel>Reason *</FormLabel>
          <FormTextarea
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Explain why this asset is being disposed..."
          />
        </div>

        {method === 'sale' && (
          <div>
            <FormLabel>Proceeds ($)</FormLabel>
            <FormInput
              type="number"
              min="0"
              step="0.01"
              value={proceeds}
              onChange={(e) => setProceeds(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        {/* P&L Preview */}
        <div className="rounded-lg border border-border bg-bg-secondary p-4 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Disposal Preview</p>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Book Value</span>
            <span className="font-medium text-foreground tabular-nums">
              ${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {method === 'sale' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Proceeds</span>
                <span className="font-medium text-foreground tabular-nums">
                  ${proceedsNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-text-secondary">P&L Impact</span>
                <span className={`font-semibold tabular-nums ${profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {profitLoss >= 0 ? '+' : ''}${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
          {method && method !== 'sale' && (
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="text-text-secondary">Write-Off</span>
              <span className="font-semibold text-red-700 tabular-nums">
                -${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting}>
            {submitting ? 'Disposing...' : 'Confirm Disposal'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
