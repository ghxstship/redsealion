'use client';

import { useState, type FormEvent } from 'react';

interface FacilityFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function FacilityFormModal({ open, onClose, onCreated }: FacilityFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('warehouse');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setName(''); setType('warehouse'); setStreet(''); setCity(''); setState(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, address: { street, city, state } }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add facility'); }
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
          <h2 className="text-lg font-semibold text-foreground">Add Facility</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Facility Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse A" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10">
                <option value="warehouse">Warehouse</option>
                <option value="office">Office</option>
                <option value="studio">Studio</option>
                <option value="storage">Storage</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Street</label>
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Facility'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
