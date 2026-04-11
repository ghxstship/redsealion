'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Alert from '@/components/ui/Alert';
import RentalStatusActions from './RentalStatusActions';

interface RentalEditFormProps {
  orderId: string;
  currentDates: { start: string; end: string };
  currentDeposit: number;
  currentNotes: string;
}

export default function RentalEditForm({ orderId, currentDates, currentDeposit, currentNotes }: RentalEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const updates: Record<string, unknown> = {};

    const start = formData.get('rental_start') as string;
    const end = formData.get('rental_end') as string;
    const deposit = formData.get('deposit') as string;
    const notes = formData.get('notes') as string;

    if (start && start !== currentDates.start) updates.rental_start = start;
    if (end && end !== currentDates.end) updates.rental_end = end;
    if (deposit) updates.deposit_cents = Math.round(parseFloat(deposit) * 100);
    if (notes !== currentNotes) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/rentals/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to update rental order.');
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Actions */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Status Transitions</h4>
        <RentalStatusActions orderId={orderId} currentStatus="" />
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Edit Details</h4>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">Rental order updated successfully.</Alert>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel>Start Date</FormLabel>
              <FormInput
                name="rental_start"
                type="date"
                defaultValue={currentDates.start?.split('T')[0] ?? ''}
              />
            </div>
            <div>
              <FormLabel>End Date</FormLabel>
              <FormInput
                name="rental_end"
                type="date"
                defaultValue={currentDates.end?.split('T')[0] ?? ''}
              />
            </div>
          </div>
          <div>
            <FormLabel>Deposit ($)</FormLabel>
            <FormInput
              name="deposit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={currentDeposit > 0 ? (currentDeposit / 100).toFixed(2) : ''}
              placeholder="0.00"
            />
          </div>
          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              name="notes"
              rows={2}
              defaultValue={currentNotes}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Special instructions..."
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
