'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { toast } from 'react-hot-toast';

interface WorkOrderActionsProps {
  id: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { label: string; nextStatus: string; variant: 'primary' | 'secondary'; className?: string }[]> = {
  draft: [
    { label: 'Dispatch', nextStatus: 'dispatched', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
  dispatched: [
    { label: 'Start Work', nextStatus: 'in_progress', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
  accepted: [
    { label: 'Start Work', nextStatus: 'in_progress', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
  in_progress: [
    { label: 'Complete', nextStatus: 'completed', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
};

export default function WorkOrderActions({ id, currentStatus }: WorkOrderActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  async function handleTransition(nextStatus: string) {
    setPendingTransition(null);
    setUpdating(nextStatus);
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to update status.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.nextStatus}
          variant={action.variant}
          size="sm"
          className={action.className}
          disabled={updating !== null}
          onClick={() => setPendingTransition(action.nextStatus)}
        >
          {updating === action.nextStatus ? 'Updating...' : action.label}
        </Button>
      ))}
    </div>

    <ConfirmDialog
      open={!!pendingTransition}
      title="Update Work Order"
      message={`Are you sure you want to change this work order to "${pendingTransition?.replace(/_/g, ' ') ?? ''}"?`}
      variant="default"
      confirmLabel="Confirm"
      onConfirm={() => { if (pendingTransition) handleTransition(pendingTransition); }}
      onCancel={() => setPendingTransition(null)}
    />
    </>
  );
}
