'use client';

import { useState } from 'react';
import FormLabel from '@/components/ui/FormLabel';

interface DepositGateProps {
  proposalId: string;
  proposalName: string;
  depositRequired: boolean;
  depositAmount: number | null;
  depositPercent: number | null;
  depositPaid: boolean;
  totalValue: number;
  orgName: string;
}

export default function DepositGate({
  proposalName,
  depositRequired,
  depositAmount,
  depositPercent,
  depositPaid,
  totalValue,
  orgName,
}: DepositGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!depositRequired || depositPaid) return null;

  const amount = depositAmount ?? (depositPercent ? totalValue * (depositPercent / 100) : 0);
  const percent = depositPercent ?? (depositAmount ? Math.round((depositAmount / totalValue) * 100) : 0);

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Deposit Required</h3>
          <p className="mt-1 text-sm text-amber-800">
            {orgName} requires a {percent}% deposit (${amount.toLocaleString()}) on{' '}
            <strong>{proposalName}</strong> before production can begin.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">Proposal Total</span>
          <span className="text-sm font-medium text-foreground">${totalValue.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">Deposit Amount ({percent}%)</span>
          <span className="text-sm font-semibold text-amber-800">${amount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Balance Due</span>
          <span className="text-sm text-foreground">${(totalValue - amount).toLocaleString()}</span>
        </div>
      </div>

      <FormLabel className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 rounded border-amber-300"
        />
        <span className="text-xs text-amber-800">
          I understand that a deposit of ${amount.toLocaleString()} is required and will be invoiced upon proposal approval.
        </span>
      </FormLabel>

      <div className="flex justify-end">
        <button
          disabled={!acknowledged}
          style={{ backgroundColor: 'var(--org-primary, #d97706)' }}
        >
          Approve & Pay Deposit
        </button>
      </div>
    </div>
  );
}
