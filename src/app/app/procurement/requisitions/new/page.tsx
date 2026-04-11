'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { TierGate } from '@/components/shared/TierGate';
import Alert from '@/components/ui/Alert';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_cost_cents: number;
}

export default function NewRequisitionPage() {
  const router = useRouter();
  const [priority, setPriority] = useState('medium');
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [newLine, setNewLine] = useState({ description: '', quantity: 1, unit_cost_cents: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addLine() {
    if (!newLine.description.trim()) return;
    setLineItems([...lineItems, { ...newLine, id: crypto.randomUUID() }]);
    setNewLine({ description: '', quantity: 1, unit_cost_cents: 0 });
  }

  function removeLine(id: string) {
    setLineItems(lineItems.filter((l) => l.id !== id));
  }

  const total = lineItems.reduce((s, l) => s + l.quantity * l.unit_cost_cents, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Create requisition header
      const res = await fetch('/api/purchase-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority, needed_by: neededBy || null, notes: notes || null }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create requisition');
      }

      const { requisition } = await res.json();

      // 2. Add line items
      for (const line of lineItems) {
        await fetch(`/api/purchase-requisitions/${requisition.id}/line-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: line.description,
            quantity: line.quantity,
            unit_cost_cents: line.unit_cost_cents,
          }),
        });
      }

      router.push(`/app/procurement/requisitions/${requisition.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="procurement">
      <PageHeader title="New Requisition" subtitle="Submit a purchase request for approval." />

      <div className="mb-4">
        <Link href="/app/procurement/requisitions" className="text-sm text-brand-primary hover:underline">
          ← Back to Requisitions
        </Link>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Header fields */}
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Request Details</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Needed By</label>
              <input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Justification or context for this request..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Line Items</h3>

          {lineItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 w-20">Qty</th>
                    <th className="px-3 py-2 w-28">Unit Cost</th>
                    <th className="px-3 py-2 w-28">Total</th>
                    <th className="px-3 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2">{l.description}</td>
                      <td className="px-3 py-2 tabular-nums">{l.quantity}</td>
                      <td className="px-3 py-2 tabular-nums">${(l.unit_cost_cents / 100).toFixed(2)}</td>
                      <td className="px-3 py-2 tabular-nums font-medium">${((l.quantity * l.unit_cost_cents) / 100).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeLine(l.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold text-xs text-text-secondary uppercase">Total</td>
                    <td className="px-3 py-2 tabular-nums font-semibold">${(total / 100).toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
              <input
                type="text"
                value={newLine.description}
                onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                placeholder="Material or service..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium text-text-secondary mb-1">Qty</label>
              <input
                type="number"
                min={1}
                value={newLine.quantity}
                onChange={(e) => setNewLine({ ...newLine, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-text-secondary mb-1">Unit ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={(newLine.unit_cost_cents / 100).toFixed(2)}
                onChange={(e) => setNewLine({ ...newLine, unit_cost_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addLine}
              className="rounded-lg bg-bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-border transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/app/procurement/requisitions"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || lineItems.length === 0}
            className="rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Requisition'}
          </button>
        </div>
      </form>
    </TierGate>
  );
}
