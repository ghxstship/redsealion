'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';

interface SendProposalButtonProps {
  proposalId: string;
  currentStatus: string;
}

export default function SendProposalButton({ proposalId, currentStatus }: SendProposalButtonProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Only show for draft proposals
  if (currentStatus !== 'draft') return null;

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to send proposal.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSending(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <Button onClick={() => setShowConfirm(true)} disabled={sending}>
        {sending ? 'Sending...' : 'Send Proposal'}
      </Button>
      <ConfirmDialog
        open={showConfirm}
        title="Send Proposal"
        message='Send this proposal to the client? This will mark it as "sent" and set the sent_at timestamp.'
        confirmLabel="Send"
        onConfirm={handleSend}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
