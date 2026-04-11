'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import Alert from '@/components/ui/Alert';

interface CreateSubRentalButtonProps {}

export default function CreateSubRentalButton({}: CreateSubRentalButtonProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const supabase = createClient();
      const ctx = await resolveClientOrg();
      if (!ctx) return;

      const { data, error } = await supabase
        .from('sub_rentals')
        .insert({
          organization_id: ctx.organizationId,
          status: 'requested',
          rental_start: new Date().toISOString().split('T')[0],
          rental_end: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          total_cost_cents: 0,
        })
        .select('id')
        .single();

      if (data?.id) {
        router.refresh();
      }
    } catch {
      setError('Failed to create sub-rental.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button size="sm" onClick={handleCreate} disabled={creating}>
      {creating ? 'Creating...' : 'New Sub-Rental'}
    </Button>
  );
}
