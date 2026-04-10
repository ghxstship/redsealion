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

interface AddMilestoneButtonProps {
  schedules: Array<{ id: string; name: string }>;
}

export default function AddMilestoneButton({ schedules }: AddMilestoneButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const scheduleId = formData.get('schedule_id') as string;
    const title = formData.get('title') as string;
    const dueAt = formData.get('due_at') as string;

    if (!scheduleId || !title || !dueAt) {
      setError('All fields are required.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('schedule_milestones').insert({
        schedule_id: scheduleId,
        title,
        due_at: new Date(dueAt).toISOString(),
        status: 'pending',
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
      <Button size="sm" onClick={() => setOpen(true)}>Add Milestone</Button>

      <ModalShell title="Add Milestone" open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <div>
            <FormLabel>Schedule *</FormLabel>
            <FormSelect name="schedule_id" required>
              <option value="">Select schedule...</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Milestone Title *</FormLabel>
            <FormInput name="title" required placeholder="e.g., Load-in complete" />
          </div>
          <div>
            <FormLabel>Due Date *</FormLabel>
            <FormInput name="due_at" type="datetime-local" required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Milestone'}</Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
