'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreditNoteFormModal from '@/components/admin/invoices/CreditNoteFormModal';

export default function CreditNotesHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Issue Credit Note
      </button>
      <CreditNoteFormModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
