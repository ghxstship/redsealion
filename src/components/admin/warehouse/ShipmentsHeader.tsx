'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import ShipmentForm from '@/components/admin/warehouse/ShipmentForm';

export default function ShipmentsHeader({ defaultDirection }: { defaultDirection: 'inbound' | 'outbound' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} />
        New Shipment
      </Button>
      {open && (
        <ShipmentForm
          defaultDirection={defaultDirection}
          onClose={() => setOpen(false)}
          onCreated={() => {
            router.refresh();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
