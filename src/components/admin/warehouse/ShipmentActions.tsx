'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function ShipmentActions({
  shipmentId,
  currentStatus,
  direction,
}: {
  shipmentId: string;
  currentStatus: string;
  direction: 'inbound' | 'outbound';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const outboundTransitions: Record<string, { label: string; next: string }[]> = {
    pending: [{ label: 'Pick', next: 'picked' }],
    picked: [{ label: 'Pack', next: 'packed' }],
    packed: [{ label: 'Ship', next: 'shipped' }],
    shipped: [{ label: 'In Transit', next: 'in_transit' }],
    in_transit: [{ label: 'Mark Delivered', next: 'delivered' }],
  };

  const inboundTransitions: Record<string, { label: string; next: string }[]> = {
    pending: [{ label: 'Ship', next: 'shipped' }],
    shipped: [{ label: 'In Transit', next: 'in_transit' }],
    in_transit: [{ label: 'Mark Received', next: 'received' }],
  };

  const transitions = direction === 'outbound' ? outboundTransitions : inboundTransitions;
  const availableActions = transitions[currentStatus] || [];

  if (availableActions.length === 0) return null;

  const handleTransition = async (nextStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {availableActions.map((action) => (
        <Button
          key={action.next}
          variant="primary"
          onClick={() => handleTransition(action.next)}
          disabled={loading}
        >
          {loading ? 'Updating...' : action.label}
        </Button>
      ))}
    </div>
  );
}
