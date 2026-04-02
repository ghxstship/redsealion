'use client';

import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';

const SAMPLE_CREDIT_NOTES = [
  {
    id: '1',
    credit_number: 'CN-2026-001',
    invoice_number: 'INV-2026-015',
    amount: 2500,
    reason: 'Scope reduction - removed two display panels',
    issued_date: '2026-03-20',
    client_name: 'ACME Corp',
  },
  {
    id: '2',
    credit_number: 'CN-2026-002',
    invoice_number: 'INV-2026-022',
    amount: 800,
    reason: 'Early payment discount applied',
    issued_date: '2026-03-25',
    client_name: 'Global Events Inc',
  },
];

export default function CreditNotesPage() {
  return (
    <TierGate feature="credit_notes">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Credit Notes
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage credit notes issued against invoices.
          </p>
        </div>
        <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
          Issue Credit Note
        </button>
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        <div className="grid grid-cols-6 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider text-text-muted">
          <span>Credit #</span>
          <span>Invoice</span>
          <span>Client</span>
          <span>Amount</span>
          <span>Reason</span>
          <span>Issued</span>
        </div>
        {SAMPLE_CREDIT_NOTES.map((cn) => (
          <div key={cn.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center">
            <span className="text-sm font-medium text-foreground">{cn.credit_number}</span>
            <span className="text-sm text-text-secondary">{cn.invoice_number}</span>
            <span className="text-sm text-text-secondary">{cn.client_name}</span>
            <span className="text-sm font-medium text-red-600">-{formatCurrency(cn.amount)}</span>
            <span className="text-sm text-text-secondary truncate">{cn.reason}</span>
            <span className="text-sm text-text-muted">{cn.issued_date}</span>
          </div>
        ))}
      </div>

      {SAMPLE_CREDIT_NOTES.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No credit notes issued yet.</p>
        </div>
      )}
    </TierGate>
  );
}
