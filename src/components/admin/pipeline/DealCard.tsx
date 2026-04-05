'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { DealStage } from '@/types/database';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

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
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete deal');
    router.refresh();
  }

  return (
    <>
      <div className="group relative rounded-lg border border-border bg-white p-3 shadow-sm transition-colors hover:border-foreground/20">
        <Link href={`/app/pipeline/${id}`} className="block">
          <p className="text-sm font-medium text-foreground truncate pr-6">{title}</p>
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
        <button
          onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-text-muted hover:text-red-600 hover:bg-red-50"
          title="Delete deal"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h10M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M9 4v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

