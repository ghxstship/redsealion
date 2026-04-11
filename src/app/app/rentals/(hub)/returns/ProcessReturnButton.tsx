'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import Alert from '@/components/ui/Alert';

interface ProcessReturnButtonProps {
  itemId: string;
  itemName: string;
}

export default function ProcessReturnButton({ itemId, itemName }: ProcessReturnButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const condition = formData.get('condition') as string;
    const damageNotes = formData.get('damage_notes') as string;

    try {
      const supabase = createClient();
      const status = condition === 'good' ? 'returned' : condition === 'lost' ? 'lost' : 'damaged';

      const { error: updateError } = await supabase
        .from('rental_line_items')
        .update({
          status,
          return_condition: condition,
          damage_notes: damageNotes || null,
          return_date: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) {
        setError(updateError.message);
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
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Process Return
      </button>

      <ModalShell title={`Process Return: ${itemName}`} open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}
          <div>
            <FormLabel>Return Condition *</FormLabel>
            <FormSelect name="condition" required>
              <option value="good">Good — No damage</option>
              <option value="fair">Fair — Minor wear</option>
              <option value="damaged">Damaged — Needs repair</option>
              <option value="lost">Lost — Cannot locate</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Damage Notes</FormLabel>
            <textarea
              name="damage_notes"
              rows={3}
              placeholder="Describe any damage or issues..."
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Processing...' : 'Process Return'}</Button>
          </div>
        </form>
      </ModalShell>
    </>
  );
}
