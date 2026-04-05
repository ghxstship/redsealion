'use client';

import { useState, type FormEvent } from 'react';

interface PortfolioFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }
const CATEGORIES = ['Brand Activation', 'Concert & Festival', 'Corporate Event', 'Film & TV', 'Immersive Experience', 'Pop-Up', 'Trade Show', 'Other'] as const;

export default function PortfolioFormModal({ open, onClose, onCreated }: PortfolioFormModalProps) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [projectYear, setProjectYear] = useState(String(new Date().getFullYear()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setProjectName(''); setClientName(''); setCategory(''); setDescription(''); setProjectYear(String(new Date().getFullYear())); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          client_name: clientName || undefined,
          category,
          description: description || undefined,
          project_year: parseInt(projectYear) || new Date().getFullYear(),
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add project'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 animate-modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-xl animate-modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Add Portfolio Project</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15" /><line x1="15" y1="5" x2="5" y2="15" /></svg>
          </button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Project Name</label>
              <input type="text" required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Nike Air Max Launch" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Client</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Nike" className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10">
                <option value="">Select...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Year</label>
              <input type="number" value={projectYear} onChange={(e) => setProjectYear(e.target.value)} min={2000} max={2100} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief project description..." className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
