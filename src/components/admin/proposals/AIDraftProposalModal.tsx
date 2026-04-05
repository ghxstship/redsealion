'use client';

import { useState } from 'react';

interface AIDraftProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftReady: (draft: Record<string, unknown>) => void;
}

export default function AIDraftProposalModal({ isOpen, onClose, onDraftReady }: AIDraftProposalModalProps) {
  const [form, setForm] = useState({
    event_type: '',
    estimated_budget: '',
    description: '',
    client_id: '',
    lead_id: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/draft-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: form.event_type || undefined,
          estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : undefined,
          description: form.description || undefined,
          client_id: form.client_id || undefined,
          lead_id: form.lead_id || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate draft.');
      }

      const data = await res.json();
      onDraftReady(data.draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">AI Proposal Draft</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            We&apos;ll use your templates and historical pricing to generate a starting point.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Event Type</label>
            <select
              value={form.event_type}
              onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select type…</option>
              <option value="corporate_event">Corporate Event</option>
              <option value="live_concert">Live Concert / Festival</option>
              <option value="brand_activation">Brand Activation</option>
              <option value="trade_show">Trade Show / Expo</option>
              <option value="immersive_experience">Immersive Experience</option>
              <option value="pop_up">Pop-Up</option>
              <option value="theatrical">Theatrical Production</option>
              <option value="film_broadcast">Film / TV / Broadcast</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Estimated Budget</label>
            <input
              type="number"
              value={form.estimated_budget}
              onChange={(e) => setForm((p) => ({ ...p, estimated_budget: e.target.value }))}
              placeholder="50000"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Brief Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Tell us about the event, venue, and goals…"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="rounded-lg border border-border bg-bg-secondary/50 p-3">
            <p className="text-xs text-text-muted">
              <strong>How it works:</strong> We analyze your existing phase templates and recent approved proposals
              to suggest a structured draft with realistic pricing. You&apos;ll have full control to edit before sending.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {generating ? 'Generating Draft…' : 'Generate Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
