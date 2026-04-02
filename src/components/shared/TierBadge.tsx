'use client';

import type { SubscriptionTier } from '@/types/database';
import { getTierLabel } from '@/lib/subscription';

export function TierBadge({ tier }: { tier: SubscriptionTier }) {
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted bg-bg-secondary">
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1.5" y="4.5" width="7" height="5" rx="1" />
        <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
      </svg>
      {getTierLabel(tier)}
    </span>
  );
}

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="6" width="10" height="7" rx="1.5" />
      <path d="M4 6V4.5a3 3 0 0 1 6 0V6" />
    </svg>
  );
}
