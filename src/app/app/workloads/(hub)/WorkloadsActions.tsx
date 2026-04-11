'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import AllocationModal from '../AllocationModal';

export default function WorkloadsActions() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>
        New Allocation
      </Button>

      <AllocationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
