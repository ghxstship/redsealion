'use client';

import Link from 'next/link';
import { usePortalContext } from './PortalContext';

/**
 * Persistent banner at the top of the portal demo shell.
 * Communicates the demo state and provides a clear CTA to start a trial.
 */
export default function DemoBanner() {
  const { orgSlug } = usePortalContext();

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-2.5 text-center text-sm text-white">
      <span className="inline-flex items-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M8 1l1.5 3.5L13 6l-2.5 2.5.5 4L8 11l-3 1.5.5-4L3 6l3.5-1.5L8 1Z" />
        </svg>
        <span className="font-medium">You&apos;re exploring FlyteDeck in demo mode</span>
      </span>
      <span className="hidden sm:inline text-white/60">—</span>
      <Link
        href={`/portal/${orgSlug}/pricing`}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25"
      >
        Start your 14-day free trial
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}
