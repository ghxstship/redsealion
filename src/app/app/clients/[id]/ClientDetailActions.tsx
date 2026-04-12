import Button from '@/components/ui/Button';
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Pencil } from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AddContactModal from '@/components/admin/clients/AddContactModal';
import EditClientModal from '@/components/admin/clients/EditClientModal';
import AddInteractionModal from '@/components/admin/clients/AddInteractionModal';

interface ClientDetailActionsProps {
  clientId: string;
  clientName: string;
  clientData?: {
    company_name: string;
    industry: string | null;
    website: string | null;
    linkedin: string | null;
    source: string | null;
    notes: string | null;
    annual_revenue: number | null;
    employee_count: number | null;
    status: string;
  };
}

export default function ClientDetailActions({ clientId, clientName, clientData }: ClientDetailActionsProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);

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
        <Button
          onClick={() => setShowInteraction(true)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Log Interaction
        </Button>
        <Button
          onClick={() => setShowAddContact(true)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          + Add Contact
        </Button>
        <Button
          onClick={() => setShowEdit(true)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          <Pencil size={14} className="inline mr-1" />
          Edit
        </Button>
        <Button
          onClick={() => setShowDelete(true)}
          className="rounded-lg border border-red-200 bg-background px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <Trash2 size={14} className="inline mr-1" />
          Delete
        </Button>
        <Link
          href={`/app/proposals/new?client_id=${clientId}`}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          New Proposal
        </Link>
      </div>

      <AddContactModal clientId={clientId} open={showAddContact} onClose={() => setShowAddContact(false)} onCreated={() => router.refresh()} />
      <AddInteractionModal clientId={clientId} open={showInteraction} onClose={() => setShowInteraction(false)} />

      {clientData && (
        <EditClientModal
          clientId={clientId}
          open={showEdit}
          onClose={() => setShowEdit(false)}
          initialData={clientData}
        />
      )}

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
