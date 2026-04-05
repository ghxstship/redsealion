'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

export default function InvoiceActions({ invoiceId, invoiceNumber, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [showVoid, setShowVoid] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send invoice');
      }
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  async function handleVoid() {
    const res = await fetch(`/api/invoices/${invoiceId}/void`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to void invoice');
    }
    router.refresh();
    setShowVoid(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        {status === 'draft' && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Invoice'}
          </button>
        )}
        {status !== 'void' && status !== 'paid' && (
          <button
            onClick={() => setShowVoid(true)}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Void
          </button>
        )}
      </div>

      {sendError && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {sendError}
        </div>
      )}

      <ConfirmDialog
        open={showVoid}
        title="Void Invoice"
        message={`Are you sure you want to void invoice ${invoiceNumber}? This action marks the invoice as void and cannot be reversed.`}
        confirmLabel="Void Invoice"
        variant="danger"
        onConfirm={handleVoid}
        onCancel={() => setShowVoid(false)}
      />
    </>
  );
}
