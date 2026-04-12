import Button from '@/components/ui/Button';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';

interface Props {
  id: string;
  status: string;
}

export default function RequisitionActions({ id, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function updateStatus(newStatus: string) {
    setLoading(newStatus);
    setError('');
    try {
      const res = await fetch(`/api/purchase-requisitions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update status');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading('');
    }
  }

  async function convertToPO() {
    setLoading('convert');
    setError('');
    try {
      const res = await fetch(`/api/purchase-requisitions/${id}/convert-to-po`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to convert');
      const data = await res.json();
      router.push(`/app/procurement/purchase-orders/${data.purchase_order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading('');
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="flex gap-3 flex-wrap">
        {status === 'draft' && (
          <Button
            onClick={() => updateStatus('submitted')}
            disabled={!!loading}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            {loading === 'submitted' ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        )}

        {status === 'submitted' && (
          <>
            <Button
              onClick={() => updateStatus('approved')}
              disabled={!!loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading === 'approved' ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              onClick={() => updateStatus('rejected')}
              disabled={!!loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </Button>
          </>
        )}

        {status === 'approved' && (
          <Button
            onClick={convertToPO}
            disabled={!!loading}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {loading === 'convert' ? 'Converting...' : 'Convert to Purchase Order'}
          </Button>
        )}
      </div>
    </div>
  );
}
