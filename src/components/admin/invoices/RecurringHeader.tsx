'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RecurringScheduleFormModal from '@/components/admin/invoices/RecurringScheduleFormModal';

export default function RecurringHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        New Schedule
      </button>
      <RecurringScheduleFormModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
