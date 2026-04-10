'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import NewCountForm from '@/components/admin/warehouse/NewCountForm';

export default function CountsHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <IconPlus size={16} />
        New Count
      </Button>
      {open && (
        <div className="absolute top-full mt-2 right-0 w-96 z-50">
          <NewCountForm
            onClose={() => setOpen(false)}
            onCreated={() => {
              router.refresh();
              setOpen(false);
            }}
          />
        </div>
      )}
    </>
  );
}
