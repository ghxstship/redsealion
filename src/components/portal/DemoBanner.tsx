'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePortalContext } from './PortalContext';
import { Sparkles } from 'lucide-react';
import { IconChevronRight, IconX } from '@/components/ui/Icons';

/**
 * Persistent banner at the top of the portal demo shell.
 * Communicates the demo state and provides a clear CTA to start a trial.
 * L-03: Now dismissable with sessionStorage persistence.
 */
export default function DemoBanner() {
  const { orgSlug } = usePortalContext();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('demo-banner-dismissed') === 'true';
    }
    return false;
  });

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem('demo-banner-dismissed', 'true');
  }

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-2.5 text-center text-sm text-white">
      <span className="inline-flex items-center gap-2">
        <Sparkles className="shrink-0" size={16} strokeWidth={1.5} />
        <span className="font-medium">You&apos;re exploring FlyteDeck in demo mode</span>
      </span>
      <span className="hidden sm:inline text-white/60">—</span>
      <Link
        href={`/portal/${orgSlug}/pricing`}
        className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-background/25"
      >
        Start your 14-day free trial
        <IconChevronRight size={12} strokeWidth={1.5} />
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss banner"
      >
        <IconX size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
