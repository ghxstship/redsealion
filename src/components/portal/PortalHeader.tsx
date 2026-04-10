'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from '@/lib/clsx';
import { IconMenu, IconX } from '@/components/ui/Icons';
import { createBrowserClient } from '@supabase/ssr';

interface PortalHeaderProps {
  orgName: string;
  logoUrl?: string | null;
}

export default function PortalHeader({ orgName, logoUrl }: PortalHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Extract orgSlug from pathname: /portal/{orgSlug}/...
  const orgSlug = pathname.split('/')[2] || '';

  // GAP-PTL-04: Logout handler
  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      await supabase.auth.signOut();
      router.push(`/portal/${orgSlug}/login`);
    } catch {
      // Redirect even on error to clear client state
      router.push(`/portal/${orgSlug}/login`);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Org name */}
          <Link href={`/portal/${orgSlug}`} className="flex items-center gap-3">
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
            {[
              { href: `/portal/${orgSlug}`, label: 'Proposals', exact: true },
              { href: `/portal/${orgSlug}/request`, label: 'Request Work' },
              { href: `/portal/${orgSlug}/refer`, label: 'Refer' },
              { href: `/portal/${orgSlug}/account`, label: 'Account' },
            ].map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'text-sm font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-text-secondary hover:text-foreground'
                  )}
                  style={isActive ? { borderBottom: '2px solid var(--org-primary, var(--color-foreground))', paddingBottom: '2px' } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* GAP-PTL-04: Sign out button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out…' : 'Sign Out'}
            </button>
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
            mobileMenuOpen ? 'max-h-52 pb-4 opacity-100' : 'max-h-0 opacity-0'
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
            {/* GAP-PTL-04: Mobile sign out */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors text-left disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

