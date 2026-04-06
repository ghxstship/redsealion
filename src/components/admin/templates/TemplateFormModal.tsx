'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface TemplateFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function TemplateFormModal({ open, onClose, onCreated }: TemplateFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setName(''); setDescription(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to create template'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Phase Template" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Template Name</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 3-Phase" />
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this template include?" />
        </div>
        <p className="text-xs text-text-muted">You can configure phases after creation.</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Creating...' : 'Create Template'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
