'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface ConvertToRentalButtonProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
}

export default function ConvertToRentalButton({ orderId, orderNumber, currentStatus }: ConvertToRentalButtonProps) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Only show for reserved orders
  if (currentStatus !== 'reserved') return null;

  async function handleConvert() {
    setShowConfirm(false);

    setConverting(true);
    try {
      const res = await fetch(`/api/rentals/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'checked_out' }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to convert reservation.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setConverting(false);
    }
  }

  return (
    <>
    <Button size="sm" onClick={() => setShowConfirm(true)} disabled={converting}>
      {converting ? 'Converting...' : 'Convert to Rental'}
    </Button>

    <ConfirmDialog
      open={showConfirm}
      title="Convert to Rental"
      message={`Convert reservation ${orderNumber} to an active rental? This will change status to "checked_out".`}
      variant="default"
      confirmLabel="Convert"
      onConfirm={handleConvert}
      onCancel={() => setShowConfirm(false)}
    />
    </>
  );
}
