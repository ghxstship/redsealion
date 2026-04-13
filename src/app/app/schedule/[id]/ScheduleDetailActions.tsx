'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { toast } from 'react-hot-toast';

interface ScheduleDetailActionsProps {
  id: string;
  currentStatus: string;
}

const TRANSITIONS: Record<string, { label: string; nextStatus: string; variant: 'primary' | 'secondary'; className?: string }[]> = {
  draft: [
    { label: 'Publish', nextStatus: 'published', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
  published: [
    { label: 'Go Live', nextStatus: 'live', variant: 'primary' },
    { label: 'Back to Draft', nextStatus: 'draft', variant: 'secondary' },
  ],
  live: [
    { label: 'Complete', nextStatus: 'completed', variant: 'primary' },
    { label: 'Cancel', nextStatus: 'cancelled', variant: 'secondary', className: 'text-red-600 hover:bg-red-500/10' },
  ],
};

export default function ScheduleDetailActions({ id, currentStatus }: ScheduleDetailActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const actions = TRANSITIONS[currentStatus] ?? [];

  async function handleTransition(nextStatus: string) {
    setPendingTransition(null);
    setUpdating(nextStatus);
    try {
      const res = await fetch(`/api/production-schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${nextStatus.replace(/_/g, ' ')}`);
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

  async function handleDelete() {
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`/api/production-schedules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Schedule deleted');
        router.push('/app/schedule');
      } else {
        toast.error('Failed to delete schedule.');
      }
    } catch {
      toast.error('Network error.');
    }
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          disabled={updating !== null}
          onClick={() => {
            if (action.nextStatus === 'cancelled' || action.nextStatus === 'completed') {
              setPendingTransition(action.nextStatus);
            } else {
              handleTransition(action.nextStatus);
            }
          }}
          className={action.className}
        >
          {updating === action.nextStatus ? 'Updating...' : action.label}
        </Button>
      ))}

      {currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:bg-red-500/10 ml-2">
          Delete
        </Button>
      )}

      <ConfirmDialog
        open={pendingTransition !== null}
        title={`Confirm ${pendingTransition?.replace(/_/g, ' ')}`}
        description={`Are you sure you want to change this schedule's status to "${pendingTransition?.replace(/_/g, ' ')}"?`}
        confirmLabel="Confirm"
        onConfirm={() => pendingTransition && handleTransition(pendingTransition)}
        onCancel={() => setPendingTransition(null)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Schedule"
        description="This will permanently delete this schedule and all associated blocks and milestones. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
