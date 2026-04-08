'use client';

import { useState } from 'react';
import FormLabel from '@/components/ui/FormLabel';
import { IconAlert } from '@/components/ui/Icons';

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
          <IconAlert className="h-5 w-5 text-amber-600" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Deposit Required</h3>
          <p className="mt-1 text-sm text-amber-800">
            {orgName} requires a {percent}% deposit (${amount.toLocaleString()}) on{' '}
            <strong>{proposalName}</strong> before production can begin.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-background p-4">
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
