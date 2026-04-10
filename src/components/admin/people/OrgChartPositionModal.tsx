'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface OrgChartPosition {
  id: string;
  title: string;
  department: string | null;
  user_id: string | null;
  reports_to: string | null;
}

interface OrgChartPositionModalProps {
  open: boolean;
  onClose: () => void;
  position?: OrgChartPosition; // if edit
  allPositions: OrgChartPosition[];
  onSaved: () => void;
}

export default function OrgChartPositionModal({ open, onClose, position, allPositions, onSaved }: OrgChartPositionModalProps) {
  const [title, setTitle] = useState(position?.title || '');
  const [department, setDepartment] = useState(position?.department || '');
  const [reportsTo, setReportsTo] = useState(position?.reports_to || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!position;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const endpoint = isEdit ? `/api/org-chart/${position.id}` : '/api/org-chart';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          department: department || null,
          reports_to: reportsTo || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} position`);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm('Are you sure you want to delete this position?')) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/org-chart/${position.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete position');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  // Prevent self-reference or circular references simply by excluding self
  const validManagers = allPositions.filter(p => p.id !== position?.id);

  return (
    <ModalShell open={open} onClose={onClose} title={isEdit ? 'Edit Position' : 'Add Position'}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Job Title *</FormLabel>
          <FormInput required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lead Developer" />
        </div>

        <div>
          <FormLabel>Department</FormLabel>
          <FormInput value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
        </div>

        <div>
          <FormLabel>Reports To</FormLabel>
          <select 
            value={reportsTo} 
            onChange={(e) => setReportsTo(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">(No Manager)</option>
            {validManagers.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button type="button" variant="danger" onClick={handleDelete} disabled={submitting}>Delete Position</Button>
          ) : <div></div>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Position</Button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
