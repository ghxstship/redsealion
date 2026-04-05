'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
        </svg>
        New Transfer
      </button>
      {open && <TransferForm facilities={facilities} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />}
    </>
  );
}
