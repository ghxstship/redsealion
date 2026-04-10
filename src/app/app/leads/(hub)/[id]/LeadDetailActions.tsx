'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface LeadDetailActionsProps {
  leadId: string;
  status: string;
}

export default function LeadDetailActions({ leadId, status }: LeadDetailActionsProps) {
  const router = useRouter();

  async function handleConvert() {
    const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lead?')) return;
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
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}
