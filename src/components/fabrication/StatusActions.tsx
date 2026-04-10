'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface StatusActionsProps {
  orderId: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { label: string; nextStatus: string; variant: 'default' | 'secondary'; className?: string }[]> = {
  draft: [
    { label: 'Start Production', nextStatus: 'in_production', variant: 'default' },
  ],
  pending: [
    { label: 'Start Production', nextStatus: 'in_production', variant: 'default' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-50' },
  ],
  in_production: [
    { label: 'Send to QC', nextStatus: 'quality_check', variant: 'default' },
  ],
  quality_check: [
    { label: 'Mark Complete', nextStatus: 'completed', variant: 'default' },
    { label: 'Back to Production', nextStatus: 'in_production', variant: 'secondary' },
  ],
};

export default function StatusActions({ orderId, currentStatus }: StatusActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  async function handleTransition(nextStatus: string) {
    if (!confirm(`Change status to "${nextStatus.replace(/_/g, ' ')}"?`)) return;
    setUpdating(nextStatus);
    try {
      const res = await fetch(`/api/fabrication/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to update status.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.nextStatus}
          variant={action.variant}
          size="sm"
          className={action.className}
          disabled={updating !== null}
          onClick={() => handleTransition(action.nextStatus)}
        >
          {updating === action.nextStatus ? 'Updating...' : action.label}
        </Button>
      ))}
    </div>
  );
}
