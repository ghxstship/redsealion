'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface ConvertToRentalButtonProps {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
}

export default function ConvertToRentalButton({ orderId, orderNumber, currentStatus }: ConvertToRentalButtonProps) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);

  // Only show for reserved orders
  if (currentStatus !== 'reserved') return null;

  async function handleConvert() {
    if (!confirm(`Convert reservation ${orderNumber} to an active rental? This will change status to "checked_out".`)) return;

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
    <Button size="sm" onClick={handleConvert} disabled={converting}>
      {converting ? 'Converting...' : 'Convert to Rental'}
    </Button>
  );
}
