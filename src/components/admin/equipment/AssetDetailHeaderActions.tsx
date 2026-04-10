'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconTrash } from '@/components/ui/Icons';
import AssetDisposalModal from './AssetDisposalModal';

export default function AssetDetailHeaderActions({ assetId, status }: { assetId: string, status: string }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  if (status === 'disposed' || status === 'retired') {
    return null; // No actions available
  }

  return (
    <>
      <Button variant="danger" onClick={() => setModalOpen(true)}>
        <IconTrash size={16} />
        Retire Asset
      </Button>
      <AssetDisposalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onComplete={() => router.refresh()}
        assetId={assetId}
      />
    </>
  );
}
