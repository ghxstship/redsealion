'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface LeadIntakeFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function LeadIntakeFormModal({ open, onClose, onCreated }: LeadIntakeFormModalProps) {
  const [name, setName] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setName(''); setRedirectUrl(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/leads/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, redirect_url: redirectUrl || undefined, is_active: true }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to create form'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Create Lead Form" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Form Name</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Contact Form" />
        </div>
        <div>
          <FormLabel>Redirect URL</FormLabel>
          <FormInput type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://example.com/thank-you" />
        </div>
        <p className="text-xs text-text-muted">You can configure form fields after creation.</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Creating...' : 'Create Form'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
