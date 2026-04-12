'use client';

import { useState, useTransition } from 'react';
import Button from '@/components/ui/Button';

interface RequirementActionProps {
  proposalId: string;
  milestoneId: string;
  requirementId: string;
  currentStatus: string;
  assignee: string;
  action: 'approve' | 'complete';
}

export default function RequirementAction({
  proposalId,
  milestoneId,
  requirementId,
  currentStatus,
  assignee,
  action,
}: RequirementActionProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === 'complete' || status === 'waived') return null;

  // Only show for client-assigned requirements
  if (!['client', 'both'].includes(assignee)) return null;

  // Determine which button to show
  const showApprove = action === 'approve' && status === 'pending';
  const showComplete = action === 'complete' && status === 'in_progress';

  if (!showApprove && !showComplete) return null;

  async function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/proposals/${proposalId}/milestones/${milestoneId}/requirements/${requirementId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'complete' }),
          },
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to update.');
          return;
        }

        setStatus('complete');
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="shrink-0 rounded-md px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: 'var(--org-primary)' }}
      >
        {isPending ? 'Updating…' : showApprove ? 'Approve' : 'Mark Complete'}
      </Button>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </>
  );
}
