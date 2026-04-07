'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import { useGlobalModals } from '@/components/shared/GlobalModalProvider';

export default function EquipmentHeader() {
  const { openModal } = useGlobalModals();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('action=new')) {
      openModal('equipment');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [openModal]);

  return (
    <Button onClick={() => openModal('equipment')}>
      <IconPlus size={16} />
      Add Equipment
    </Button>
  );
}
