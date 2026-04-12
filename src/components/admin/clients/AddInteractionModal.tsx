'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

interface AddInteractionModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'note', label: 'Note' },
];

export default function AddInteractionModal({ open, onClose, clientId }: AddInteractionModalProps) {
  const router = useRouter();
  const [type, setType] = useState('meeting');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setType('meeting');
    setSubject('');
    setBody('');
    setOccurredAt(new Date().toISOString().split('T')[0]);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/client-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          type,
          subject,
          body: body || null,
          occurred_at: new Date(occurredAt).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to log interaction');
      }

      resetForm();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Log Interaction" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Type *</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {INTERACTION_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Date *</FormLabel>
            <FormInput type="date" required value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
        </div>

        <div>
          <FormLabel>Subject *</FormLabel>
          <FormInput type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Weekly check-in call" />
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/10 resize-none"
            placeholder="Meeting notes, action items, key takeaways..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Logging...' : 'Log Interaction'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
