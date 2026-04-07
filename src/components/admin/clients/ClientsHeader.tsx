'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import ClientFormModal from './ClientFormModal';
import { usePermissions } from '@/components/shared/PermissionsProvider';

export default function ClientsHeader() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { can } = usePermissions();

  if (!can('clients', 'create')) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)}>
        <IconPlus size={16} />
        Add Client
      </Button>
      <ClientFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
