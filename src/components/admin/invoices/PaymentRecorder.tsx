'use client';

import { useState } from 'react';
import { formatCurrencyDetailed } from '@/lib/utils';

interface PaymentRecorderProps {
  invoiceId: string;
  balanceDue: number;
}

export default function PaymentRecorder({
  invoiceId,
  balanceDue,
}: PaymentRecorderProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(balanceDue.toString());
  const [method, setMethod] = useState('wire');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // invoiceId will be used when form submission is wired to API
  void invoiceId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST to API
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">Record Payment</h2>
      <p className="text-xs text-text-muted mb-4">
        Balance due: <span className="font-semibold text-red-700">{formatCurrencyDetailed(balanceDue)}</span>
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          Record Payment
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="wire">Wire Transfer</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="ach">ACH</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Reference (optional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check #, transaction ID..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
