'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AddContactModal from '@/components/admin/clients/AddContactModal';
import ShareDialog from '@/components/shared/ShareDialog';

interface ClientDetailActionsProps {
  clientId: string;
  clientName: string;
}

export default function ClientDetailActions({ clientId, clientName }: ClientDetailActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showShare, setShowShare] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete client');
    }
    router.push('/app/clients');
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowShare(true)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Share
        </button>
        <button
          onClick={() => setShowAddContact(true)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          + Add Contact
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="inline mr-1">
            <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
          </svg>
          Delete
        </button>
        <Link
          href="/app/proposals/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          New Proposal
        </Link>
      </div>

      <AddContactModal clientId={clientId} open={showAddContact} onClose={() => setShowAddContact(false)} />
      <ShareDialog open={showShare} onClose={() => setShowShare(false)} entityType="clients" entityId={clientId} entityName={clientName} />

      <ConfirmDialog
        open={showDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${clientName}"? This will permanently remove the client and cannot be undone. Associated proposals and deals will not be deleted.`}
        confirmLabel="Delete Client"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

