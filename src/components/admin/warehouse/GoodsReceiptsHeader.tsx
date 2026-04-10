'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import GoodsReceiptForm from './GoodsReceiptForm';

export default function GoodsReceiptsHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)}>
        <IconPlus size={16} />
        New Receipt
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 shadow-lg z-50">
          <GoodsReceiptForm
            onClose={() => setOpen(false)}
            onCreated={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      )}
    </div>
  );
}
