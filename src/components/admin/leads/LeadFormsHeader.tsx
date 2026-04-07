'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import LeadIntakeFormModal from '@/components/admin/leads/LeadIntakeFormModal';

export default function LeadFormsHeader() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <IconPlus size={16} />
        New Form
      </Button>
      <LeadIntakeFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
