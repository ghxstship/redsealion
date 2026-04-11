'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

const STATUS_TRANSITIONS: Record<string, Array<{ label: string; next: string; variant: 'primary' | 'secondary' | 'danger' }>> = {
  draft: [
    { label: 'Reserve', next: 'reserved', variant: 'primary' },
    { label: 'Cancel', next: 'cancelled', variant: 'danger' },
  ],
  reserved: [
    { label: 'Check Out', next: 'checked_out', variant: 'primary' },
    { label: 'Cancel', next: 'cancelled', variant: 'danger' },
  ],
  checked_out: [
    { label: 'Mark On Site', next: 'on_site', variant: 'primary' },
  ],
  on_site: [
    { label: 'Process Return', next: 'returned', variant: 'primary' },
  ],
  returned: [
    { label: 'Mark Invoiced', next: 'invoiced', variant: 'primary' },
  ],
};

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function RentalStatusActions({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  async function handleTransition(nextStatus: string) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/rentals/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed' }));
        setError(body.error ?? 'Failed to update status.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setUpdating(false);
    }
  }

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No actions available for <span className="font-medium capitalize">{currentStatus.replace('_', ' ')}</span> orders.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}
      <p className="text-xs text-text-muted mb-2">
        Transition this order to the next stage:
      </p>
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <Button
            key={t.next}
            variant={t.variant}
            size="sm"
            disabled={updating}
            onClick={() => handleTransition(t.next)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
