'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import LocationFormModal from '@/components/admin/locations/LocationFormModal';
import { useGlobalModals } from '@/components/shared/GlobalModalProvider';

export default function LocationDetailActions({ location }: { location: any }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleDelete() {
    setIsUpdating(true);
    await fetch(`/api/locations/${location.id}`, { method: 'DELETE' });
    router.push('/app/events/locations');
  }

  async function handleArchiveToggle() {
    setIsUpdating(true);
    const newStatus = location.status === 'archived' ? 'active' : 'archived';
    await fetch(`/api/locations/${location.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    setIsUpdating(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
          Edit
        </Button>
        <RowActionMenu 
          actions={[
            location.status === 'archived'
              ? { label: 'Unarchive', onClick: handleArchiveToggle }
              : { label: 'Archive', onClick: handleArchiveToggle },
            { label: 'Delete', variant: 'danger', onClick: () => setShowDeleteConfirm(true) },
          ]} 
        />
      </div>

      <LocationFormModal 
        open={showEdit}
        location={location}
        onClose={() => setShowEdit(false)}
        onCreated={() => {
          setShowEdit(false);
          router.refresh();
        }}
      />

      {showDeleteConfirm && (
        <ConfirmDialog 
          open 
          title="Delete Location" 
          message="Are you sure you want to delete this location? This action will set a deleted_at flag." 
          confirmLabel="Delete" 
          variant="danger" 
          onConfirm={handleDelete} 
          onCancel={() => setShowDeleteConfirm(false)} 
        />
      )}
    </>
  );
}
