'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CostRateFormModal from '@/components/admin/settings/CostRateFormModal';

export default function CostRatesHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Add Rate
      </button>
      <CostRateFormModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
