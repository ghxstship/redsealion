'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface LeadDetailActionsProps {
  leadId: string;
  status: string;
}

export default function LeadDetailActions({ leadId, status }: LeadDetailActionsProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleConvert() {
    const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleDelete() {
    setShowDeleteConfirm(false);
    const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/app/leads');
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status !== 'converted' && (
        <Button onClick={handleConvert}>
          Convert to Project
        </Button>
      )}
      <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
        Delete
      </Button>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
