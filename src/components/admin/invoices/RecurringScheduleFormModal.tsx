'use client';

import { useState, type FormEvent } from 'react';

interface RecurringScheduleFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }
const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as const;

export default function RecurringScheduleFormModal({ open, onClose, onCreated }: RecurringScheduleFormModalProps) {
  const [clientId, setClientId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [nextIssueDate, setNextIssueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setClientId(''); setFrequency(''); setNextIssueDate(''); setEndDate(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, frequency, next_issue_date: nextIssueDate, end_date: endDate || undefined }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to create schedule'); }
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
          <h2 className="text-lg font-semibold text-foreground">New Recurring Schedule</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Client ID</label>
            <input type="text" required value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client UUID" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Frequency</label>
            <select required value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select frequency...</option>
              {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Next Issue Date</label>
              <input type="date" required value={nextIssueDate} onChange={(e) => setNextIssueDate(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">{submitting ? 'Creating...' : 'Create Schedule'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
