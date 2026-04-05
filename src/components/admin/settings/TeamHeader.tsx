'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InviteMemberModal from '@/components/admin/people/InviteMemberModal';

export default function TeamHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 transition-colors"
      >
        Invite Member
      </button>
      <InviteMemberModal open={open} onClose={() => setOpen(false)} onCreated={() => { router.refresh(); setOpen(false); }} />
    </>
  );
}
