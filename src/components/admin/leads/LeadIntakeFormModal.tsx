'use client';

import { useState, type FormEvent } from 'react';

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl animate-modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Create Lead Form</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Form Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Contact Form" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Redirect URL</label>
            <input type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://example.com/thank-you" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
          </div>
          <p className="text-xs text-text-muted">You can configure form fields after creation.</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Form'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
