'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * MarketingNav — Shared navigation bar used by both the root landing page
 * and the (marketing) layout to ensure a single source of truth for nav links.
 */
export default function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-16">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
          <span className="text-xs font-bold text-white">FD</span>
        </div>
        <span className="text-lg font-semibold tracking-tight text-zinc-900">
          FlyteDeck
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6">
        <Link
          href="/features"
          className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
        >
          Features
        </Link>
        <Link
          href="/use-cases"
          className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
        >
          Use Cases
        </Link>
        <Link
          href="/pricing"
          className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        >
          Get Started
        </Link>
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[72px] z-50 border-b border-zinc-200 bg-white px-6 py-4 shadow-lg sm:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/features"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/use-cases"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              Use Cases
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/compare"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              Compare
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
