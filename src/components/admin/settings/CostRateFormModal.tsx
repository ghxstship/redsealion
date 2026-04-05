'use client';

import { useState, type FormEvent } from 'react';

interface CostRateFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

const ROLES = ['project_manager', 'designer', 'fabricator', 'installer', 'technician', 'coordinator'] as const;

export default function CostRateFormModal({ open, onClose, onCreated }: CostRateFormModalProps) {
  const [role, setRole] = useState('');
  const [hourlyCost, setHourlyCost] = useState('');
  const [hourlyBillable, setHourlyBillable] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setRole(''); setHourlyCost(''); setHourlyBillable(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/cost-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, hourly_cost: parseFloat(hourlyCost), hourly_billable: parseFloat(hourlyBillable) }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add rate'); }
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
          <h2 className="text-lg font-semibold text-foreground">Add Cost Rate</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role</label>
            <select required value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select role...</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Cost Rate ($/hr)</label>
              <input type="number" required min={0} step="0.01" value={hourlyCost} onChange={(e) => setHourlyCost(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bill Rate ($/hr)</label>
              <input type="number" required min={0} step="0.01" value={hourlyBillable} onChange={(e) => setHourlyBillable(e.target.value)} placeholder="0.00" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Rate'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
