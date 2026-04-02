'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { DealStage } from '@/types/database';

interface DealCardProps {
  id: string;
  title: string;
  clientName: string;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  stage: DealStage;
}

export default function DealCard({
  id,
  title,
  clientName,
  value,
  probability,
  expectedCloseDate,
}: DealCardProps) {
  return (
    <Link
      href={`/app/pipeline/${id}`}
      className="block rounded-lg border border-border bg-white p-3 shadow-sm transition-colors hover:border-foreground/20"
    >
      <p className="text-sm font-medium text-foreground truncate">{title}</p>
      <p className="mt-1 text-xs text-text-muted truncate">{clientName}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(value)}
        </span>
        <span className="text-xs tabular-nums text-text-muted">{probability}%</span>
      </div>
      {expectedCloseDate && (
        <p className="mt-1.5 text-xs text-text-muted">
          Close:{' '}
          {new Date(expectedCloseDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      )}
    </Link>
  );
}
