'use client';

import { Lock } from 'lucide-react';
import type { SubscriptionTier } from '@/types/database';
import { getTierLabel } from '@/lib/subscription';

function TierBadge({ tier }: { tier: SubscriptionTier }) {
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted bg-bg-secondary">
      <Lock size={10} />
      {getTierLabel(tier)}
    </span>
  );
}

export function LockIcon({ className = '' }: { className?: string }) {
  return <Lock size={14} className={className} />;
}
