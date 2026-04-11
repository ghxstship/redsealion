'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import Alert from '@/components/ui/Alert';

export default function RecordRecognitionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const supabase = createClient();
      const ctx = await resolveClientOrg();
      if (!ctx) {
        setError('Not authenticated.');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from('revenue_recognition').insert({
        organization_id: ctx.organizationId,
        proposal_id: formData.get('proposal_id'),
        period_start: formData.get('period_start'),
        period_end: formData.get('period_end'),
        recognized_amount: parseFloat(formData.get('recognized_amount') as string),
        deferred_amount: parseFloat(formData.get('deferred_amount') as string) || 0,
        method: formData.get('method'),
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>Record Recognition</Button>

      <ModalShell title="Record Revenue Recognition" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}
          <div>
            <FormLabel>Proposal ID *</FormLabel>
            <FormInput name="proposal_id" required placeholder="Paste proposal UUID" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Period Start *</FormLabel>
              <FormInput name="period_start" type="date" required />
            </div>
            <div>
              <FormLabel>Period End *</FormLabel>
              <FormInput name="period_end" type="date" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Recognized Amount *</FormLabel>
              <FormInput name="recognized_amount" type="number" step="0.01" min="0" required placeholder="0.00" />
            </div>
            <div>
              <FormLabel>Deferred Amount</FormLabel>
              <FormInput name="deferred_amount" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>
          <div>
            <FormLabel>Method *</FormLabel>
            <FormSelect name="method" required>
              <option value="percentage_of_completion">Percentage of Completion</option>
              <option value="completed_contract">Completed Contract</option>
              <option value="milestone">Milestone-Based</option>
              <option value="time_and_materials">Time & Materials</option>
            </FormSelect>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record'}</Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
