'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvoicePreview from './InvoicePreview';

interface SelectOption {
  id: string;
  label: string;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

export default function InvoiceForm({
  clients,
  proposals,
}: {
  clients: SelectOption[];
  proposals: SelectOption[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [type, setType] = useState('deposit');
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);

  async function handleSave(andSend: boolean) {
    setError(null);
    const setLoading = andSend ? setSending : setSaving;
    setLoading(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          proposal_id: proposalId || undefined,
          type,
          due_date: dueDate,
          memo,
          line_items: lineItems,
          status: 'draft',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create invoice.');
        setLoading(false);
        return;
      }

      const invoiceId = data.invoice?.id;

      if (andSend && invoiceId) {
        const sendRes = await fetch(`/api/invoices/${invoiceId}/send`, {
          method: 'POST',
        });
        if (!sendRes.ok) {
          const sendData = await sendRes.json();
          setError(sendData.error ?? 'Invoice created but sending failed.');
          setLoading(false);
          router.push(`/app/invoices/${invoiceId}`);
          return;
        }
      }

      if (invoiceId) {
        router.push(`/app/invoices/${invoiceId}`);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0 }]);
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setLineItems(
      lineItems.map((li, i) => (i === index ? { ...li, ...patch } : li))
    );
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  const clientName =
    clients.find((c) => c.id === clientId)?.label ?? 'Select client';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Invoice Details</h2>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Linked Proposal (optional)
            </label>
            <select
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="">None</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
              >
                <option value="deposit">Deposit</option>
                <option value="balance">Balance</option>
                <option value="change_order">Change Order</option>
                <option value="addon">Add-on</option>
                <option value="final">Final</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Memo</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Line Items</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
            >
              + Add item
            </button>
          </div>

          {lineItems.map((li, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6">
                <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                <input
                  type="text"
                  value={li.description}
                  onChange={(e) => updateLineItem(index, { description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={li.quantity}
                  onChange={(e) => updateLineItem(index, { quantity: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs font-medium text-text-muted mb-1">Rate</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={li.rate}
                  onChange={(e) => updateLineItem(index, { rate: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  className="text-text-muted hover:text-red-600 transition-colors p-2"
                  disabled={lineItems.length <= 1}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="3" y1="3" x2="11" y2="11" />
                    <line x1="11" y1="3" x2="3" y2="11" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving || sending}
            onClick={() => handleSave(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={saving || sending}
            onClick={() => handleSave(true)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Create & Send'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <InvoicePreview
          clientName={clientName}
          invoiceNumber="(Draft)"
          lineItems={lineItems}
          total={total}
          memo={memo}
          dueDate={dueDate}
        />
      </div>
    </div>
  );
}
