'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface BlockEditModalProps {
  block: {
    id: string;
    schedule_id: string;
    title: string;
    block_type: string;
    start_time: string;
    end_time: string;
    status: string;
    location: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function BlockEditModal({ block, isOpen, onClose }: BlockEditModalProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('schedule_blocks')
        .update({
          title: formData.get('title') as string,
          block_type: formData.get('block_type') as string,
          start_time: formData.get('start_time') as string,
          end_time: formData.get('end_time') as string,
          status: formData.get('status') as string,
          location: (formData.get('location') as string) || null,
        })
        .eq('id', block.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError('Network error.');
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Edit Schedule Block" open={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div>
          <FormLabel>Title *</FormLabel>
          <FormInput name="title" required defaultValue={block.title} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Block Type</FormLabel>
            <FormSelect name="block_type" defaultValue={block.block_type}>
              <option value="load_in">Load In</option>
              <option value="build">Build</option>
              <option value="rehearsal">Rehearsal</option>
              <option value="show">Show</option>
              <option value="strike">Strike</option>
              <option value="load_out">Load Out</option>
              <option value="transition">Transition</option>
              <option value="break">Break</option>
              <option value="custom">Custom</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect name="status" defaultValue={block.status}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </FormSelect>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Start Time</FormLabel>
            <FormInput name="start_time" type="datetime-local" defaultValue={block.start_time?.slice(0, 16)} />
          </div>
          <div>
            <FormLabel>End Time</FormLabel>
            <FormInput name="end_time" type="datetime-local" defaultValue={block.end_time?.slice(0, 16)} />
          </div>
        </div>
        <div>
          <FormLabel>Location</FormLabel>
          <FormInput name="location" defaultValue={block.location ?? ''} placeholder="e.g., Main Stage, Loading Dock" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
