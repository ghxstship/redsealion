'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import { IconPlus } from '@/components/ui/Icons';
import { usePermissions } from '@/components/shared/PermissionsProvider';
import { useGlobalModals } from '@/components/shared/GlobalModalProvider';

export default function ClientsHeader() {
  const { can } = usePermissions();
  const { openModal } = useGlobalModals();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('action=new')) {
      openModal('client');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [openModal]);

  if (!can('clients', 'create')) {
    return null;
  }

  return (
    <Button onClick={() => openModal('client')}>
      <IconPlus size={16} />
      Add Client
    </Button>
  );
}
