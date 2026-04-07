'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import TransferForm from '@/components/admin/warehouse/TransferForm';

interface Facility { id: string; name: string; }

export default function TransfersHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/settings/facilities')
      .then((r) => r.json())
      .then((d) => setFacilities(d.data ?? []))
      .catch(() => setFacilities([]));
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} />
        New Transfer
      </Button>
      {open && <TransferForm facilities={facilities} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />}
    </>
  );
}
