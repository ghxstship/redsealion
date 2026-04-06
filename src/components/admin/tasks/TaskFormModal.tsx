'use client';

import { useState, type FormEvent } from 'react';
import { formatLabel } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;
const STATUS_OPTIONS = ['todo', 'in_progress', 'in_review', 'done'] as const;

export default function TaskFormModal({ open, onClose, onCreated }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle(''); setDescription(''); setPriority('medium');
    setStatus('todo'); setDueDate(''); setEstimatedHours(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          status,
          due_date: dueDate || undefined,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create task');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Task">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Title</FormLabel>
          <FormInput type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design stage layout for Nike activation" />
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Task details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Priority</FormLabel>
            <FormSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{formatLabel(p)}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </FormSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Due Date</FormLabel>
            <FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <FormLabel>Est. Hours</FormLabel>
            <FormInput type="number" min={0} step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
