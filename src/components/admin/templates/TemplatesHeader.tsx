'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import TemplateFormModal from '@/components/admin/templates/TemplateFormModal';

export default function TemplatesHeader() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <IconPlus size={16} />
        New Template
      </Button>
      <TemplateFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
