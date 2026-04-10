'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import ComposeEmailModal from './ComposeEmailModal';

export default function ComposeEmailButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Compose</Button>
      <ComposeEmailModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => setOpen(false)}
      />
    </>
  );
}
