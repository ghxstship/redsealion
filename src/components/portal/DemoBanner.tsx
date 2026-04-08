'use client';

import Link from 'next/link';
import { usePortalContext } from './PortalContext';
import { Sparkles, ChevronRight } from 'lucide-react';
import { IconChevronRight } from '@/components/ui/Icons';

/**
 * Persistent banner at the top of the portal demo shell.
 * Communicates the demo state and provides a clear CTA to start a trial.
 */
export default function DemoBanner() {
  const { orgSlug } = usePortalContext();

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
    </div>
  );
}
