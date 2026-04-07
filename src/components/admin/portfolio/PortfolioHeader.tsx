'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import PortfolioFormModal from '@/components/admin/portfolio/PortfolioFormModal';

export default function PortfolioHeader() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <IconPlus size={16} />
        Add Project
      </Button>
      <PortfolioFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
