'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LeadIntakeFormModal from '@/components/admin/leads/LeadIntakeFormModal';

export default function LeadFormsHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
        </svg>
        Create Form
      </button>
      <LeadIntakeFormModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
