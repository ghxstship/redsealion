'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FacilityFormModal from '@/components/admin/settings/FacilityFormModal';

export default function FacilitiesHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Add Facility
      </button>
      <FacilityFormModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
