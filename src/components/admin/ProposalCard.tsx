'use client';

import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import type { ProposalStatus } from '@/types/database';

interface ProposalCardProps {
  id: string;
  name: string;
  subtitle: string | null;
  clientName: string;
  status: ProposalStatus;
  totalValue: number;
  preparedDate: string | null;
  probability: number | null;
  currency?: string;
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ProposalCard({
  id,
  name,
  subtitle,
  clientName,
  status,
  totalValue,
  preparedDate,
  probability,
  currency = 'USD',
}: ProposalCardProps) {
  return (
    <Link
      href={`/app/proposals/${id}`}
      className="group block rounded-xl border border-border bg-white px-5 py-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {clientName}
          </p>
          <h3 className="mt-1.5 text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-text-secondary truncate">
              {subtitle}
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(status)}`}
        >
          {formatStatus(status)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {formatCurrency(totalValue, currency)}
          </p>
          {preparedDate && (
            <p className="mt-0.5 text-xs text-text-muted">
              {new Date(preparedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        {probability !== null && (
          <div className="text-right">
            <p className="text-xs text-text-muted">Probability</p>
            <p className="text-sm font-medium text-foreground">{probability}%</p>
          </div>
        )}
      </div>
    </Link>
  );
}
