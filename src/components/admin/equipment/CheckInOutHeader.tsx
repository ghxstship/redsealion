'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus, IconArrowDown } from '@/components/ui/Icons';
import AssetCheckInOutModal from './AssetCheckInOutModal';

interface AssetList {
  id: string;
  name: string;
}

export default function CheckInOutHeader({ availableAssets, deployedAssets }: { availableAssets: AssetList[], deployedAssets: AssetList[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState<'check_out' | 'check_in'>('check_out');

  function openModal(act: 'check_out' | 'check_in') {
    setAction(act);
    setModalOpen(true);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => openModal('check_in')}>
          <IconArrowDown size={16} />
          Check In
        </Button>
        <Button onClick={() => openModal('check_out')}>
          <IconPlus size={16} />
          Check Out
        </Button>
      </div>
      {modalOpen && (
        <AssetCheckInOutModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onComplete={() => { router.refresh(); }}
          action={action}
          assets={action === 'check_out' ? availableAssets : deployedAssets}
        />
      )}
    </>
  );
}
