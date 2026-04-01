'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from '@/lib/clsx';

interface PortalHeaderProps {
  orgName: string;
  logoUrl?: string | null;
}

export default function PortalHeader({ orgName, logoUrl }: PortalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Org name */}
          <Link href="#" className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ color: 'var(--org-primary)' }}
              >
                {orgName}
              </span>
            )}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#"
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
              style={{ '--tw-hover-color': 'var(--org-primary)' } as React.CSSProperties}
            >
              Proposals
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Account
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-text-secondary hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile navigation */}
        <div
          className={clsx(
            'md:hidden overflow-hidden transition-all duration-200',
            mobileMenuOpen ? 'max-h-40 pb-4' : 'max-h-0'
          )}
        >
          <nav className="flex flex-col gap-3 pt-2">
            <Link
              href="#"
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Proposals
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Account
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
