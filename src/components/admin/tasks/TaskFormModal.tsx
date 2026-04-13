'use client';

import { useState, useEffect, type FormEvent } from 'react';
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
const RECURRENCE_OPTIONS = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;

export default function TaskFormModal({ open, onClose, onCreated }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      if (!open) return;
      setLoadingProjects(true);
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, [open]);

  function resetForm() {
    setTitle(''); setDescription(''); setPriority('medium');
    setStatus('todo'); setDueDate(''); setEstimatedHours('');
    setRecurrence('none'); setRecurrenceInterval('1'); setRecurrenceEnd('');
    setProjectId('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const recurrenceRule = recurrence !== 'none' ? {
      frequency: recurrence,
      interval: parseInt(recurrenceInterval) || 1,
      end_date: recurrenceEnd || undefined,
      occurrences_created: 0,
    } : undefined;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          priority,
          status,
          project_id: projectId || undefined,
          due_date: dueDate || undefined,
          estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          recurrence_rule: recurrenceRule,
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

        <div>
          <FormLabel>Project (Optional)</FormLabel>
          <FormSelect value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={loadingProjects}>
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FormSelect>
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

        {/* Recurrence */}
        <div>
          <FormLabel>Repeat</FormLabel>
          <FormSelect value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r === 'none' ? 'Does not repeat' : formatLabel(r)}</option>
            ))}
          </FormSelect>
        </div>

        {recurrence !== 'none' && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-bg-secondary/30 p-3">
            <div>
              <FormLabel>Every</FormLabel>
              <div className="flex items-center gap-2">
                <FormInput
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-text-secondary">
                  {recurrence === 'daily' ? 'day(s)' : recurrence === 'weekly' ? 'week(s)' : recurrence === 'monthly' ? 'month(s)' : 'year(s)'}
                </span>
              </div>
            </div>
            <div>
              <FormLabel>Until (optional)</FormLabel>
              <FormInput
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
              />
            </div>
          </div>
        )}

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
