'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface SendProposalButtonProps {
  proposalId: string;
  currentStatus: string;
}

export default function SendProposalButton({ proposalId, currentStatus }: SendProposalButtonProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  // Only show for draft proposals
  if (currentStatus !== 'draft') return null;

  async function handleSend() {
    if (!confirm('Send this proposal to the client? This will mark it as "sent" and set the sent_at timestamp.')) return;

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
        alert(data.error ?? 'Failed to send proposal.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Button onClick={handleSend} disabled={sending}>
      {sending ? 'Sending...' : 'Send Proposal'}
    </Button>
  );
}
