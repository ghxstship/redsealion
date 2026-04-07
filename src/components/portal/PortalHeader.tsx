'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';
import { IconMenu, IconX } from '@/components/ui/Icons';

interface PortalHeaderProps {
  orgName: string;
  logoUrl?: string | null;
}

export default function PortalHeader({ orgName, logoUrl }: PortalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  // Extract orgSlug from pathname: /portal/{orgSlug}/...
  const orgSlug = pathname.split('/')[2] || '';

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
              href={`/portal/${orgSlug}`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Proposals
            </Link>
            <Link
              href={`/portal/${orgSlug}/request`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Request Work
            </Link>
            <Link
              href={`/portal/${orgSlug}/refer`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Refer
            </Link>
            <Link
              href={`/portal/${orgSlug}/account`}
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
              {mobileMenuOpen ? (
                <IconX className="h-5 w-5" strokeWidth={1.5} />
              ) : (
                <IconMenu className="h-5 w-5" strokeWidth={1.5} />
              )}
          </button>
        </div>

        {/* Mobile navigation */}
        <div
          className={clsx(
            'md:hidden overflow-hidden transition-[max-height,opacity] duration-normal ease-in-out',
            mobileMenuOpen ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="flex flex-col gap-3 pt-2">
            <Link
              href={`/portal/${orgSlug}`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Proposals
            </Link>
            <Link
              href={`/portal/${orgSlug}/request`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Request Work
            </Link>
            <Link
              href={`/portal/${orgSlug}/refer`}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Refer
            </Link>
            <Link
              href={`/portal/${orgSlug}/account`}
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
