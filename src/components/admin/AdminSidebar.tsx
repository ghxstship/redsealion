'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { LockIcon } from '@/components/shared/TierBadge';
import type { FeatureKey } from '@/lib/subscription';

interface NavItem {
  label: string;
  href: string;
  feature?: FeatureKey;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/app',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="7" height="7" rx="1" />
        <rect x="10" y="1" width="7" height="7" rx="1" />
        <rect x="1" y="10" width="7" height="7" rx="1" />
        <rect x="10" y="10" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Proposals',
    href: '/app/proposals',
    feature: 'proposals',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7l-6-6Z" />
        <path d="M10 1v6h6" />
      </svg>
    ),
  },
  {
    label: 'Pipeline',
    href: '/app/pipeline',
    feature: 'pipeline',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 3h16v3l-6 4v5l-4 2v-7L1 6V3Z" />
      </svg>
    ),
  },
  {
    label: 'Clients',
    href: '/app/clients',
    feature: 'clients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 16v-1.5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3V16" />
        <circle cx="7.5" cy="5" r="3" />
        <path d="M16 16v-1.5a3 3 0 0 0-2-2.83" />
        <path d="M12 2.17a3 3 0 0 1 0 5.66" />
      </svg>
    ),
  },
  {
    label: 'Invoices',
    href: '/app/invoices',
    feature: 'invoices',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
        <line x1="6" y1="6" x2="12" y2="6" />
        <line x1="6" y1="9" x2="12" y2="9" />
        <line x1="6" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    href: '/app/reports',
    feature: 'reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1Z" />
        <path d="M5 16h8" />
        <path d="M9 13v3" />
        <path d="M5 10V8" />
        <path d="M9 10V7" />
        <path d="M13 10V6" />
      </svg>
    ),
  },
  {
    label: 'Portfolio',
    href: '/app/portfolio',
    feature: 'portfolio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="16" height="12" rx="1" />
        <circle cx="5.5" cy="7.5" r="1.5" />
        <path d="M17 12l-4-4-3 3-2-2-6 6" />
      </svg>
    ),
  },
  {
    label: 'Assets',
    href: '/app/assets',
    feature: 'assets',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.5 12.5L9 16l-6.5-3.5" />
        <path d="M15.5 9L9 12.5 2.5 9" />
        <path d="M9 2L2.5 5.5 9 9l6.5-3.5L9 2Z" />
      </svg>
    ),
  },
  {
    label: 'Team',
    href: '/app/team',
    feature: 'team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16v-1a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v1" />
        <circle cx="7" cy="6" r="3" />
        <path d="M16 16v-1a3 3 0 0 0-2.25-2.9" />
        <circle cx="12.5" cy="6" r="2.5" />
      </svg>
    ),
  },
  {
    label: 'Integrations',
    href: '/app/integrations',
    feature: 'integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 4.5L6 3 3 6l1.5 1.5" />
        <path d="M10.5 13.5L12 15l3-3-1.5-1.5" />
        <line x1="5" y1="13" x2="13" y2="5" />
      </svg>
    ),
  },
  {
    label: 'Time',
    href: '/app/time',
    feature: 'time_tracking',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="7.5" />
        <path d="M9 4.5V9l3 1.5" />
      </svg>
    ),
  },
  {
    label: 'Templates',
    href: '/app/templates',
    feature: 'templates',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6l7-4 7 4" />
        <path d="M2 10l7 4 7-4" />
        <path d="M2 6l7 4 7-4" />
      </svg>
    ),
  },
  {
    label: 'Terms',
    href: '/app/terms',
    feature: 'terms',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8" />
        <path d="M13 2v14" />
        <path d="M13 2c1.1 0 2 .9 2 2" />
        <path d="M13 16c1.1 0 2-.9 2-2" />
        <path d="M15 4v10" />
        <line x1="6" y1="6" x2="11" y2="6" />
        <line x1="6" y1="9" x2="10" y2="9" />
        <line x1="6" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/app/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="2.5" />
        <path d="M15.4 11.2a1.2 1.2 0 0 0 .2 1.3l.04.04a1.44 1.44 0 1 1-2.04 2.04l-.04-.04a1.2 1.2 0 0 0-1.3-.2 1.2 1.2 0 0 0-.72 1.1v.12a1.44 1.44 0 0 1-2.88 0v-.06a1.2 1.2 0 0 0-.78-1.1 1.2 1.2 0 0 0-1.3.2l-.04.04a1.44 1.44 0 1 1-2.04-2.04l.04-.04a1.2 1.2 0 0 0 .2-1.3 1.2 1.2 0 0 0-1.1-.72H3.44a1.44 1.44 0 0 1 0-2.88h.06a1.2 1.2 0 0 0 1.1-.78 1.2 1.2 0 0 0-.2-1.3l-.04-.04a1.44 1.44 0 1 1 2.04-2.04l.04.04a1.2 1.2 0 0 0 1.3.2h.06a1.2 1.2 0 0 0 .72-1.1V3.44a1.44 1.44 0 0 1 2.88 0v.06a1.2 1.2 0 0 0 .72 1.1 1.2 1.2 0 0 0 1.3-.2l.04-.04a1.44 1.44 0 1 1 2.04 2.04l-.04.04a1.2 1.2 0 0 0-.2 1.3v.06a1.2 1.2 0 0 0 1.1.72h.12a1.44 1.44 0 0 1 0 2.88h-.06a1.2 1.2 0 0 0-1.1.72Z" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canAccess } = useSubscription();

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg border border-border bg-white p-2 shadow-sm"
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {mobileOpen ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-border
          flex flex-col
          transition-transform duration-200 ease-in-out
          md:translate-x-0 md:static md:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
            <span className="text-white text-sm font-semibold tracking-tight">X</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">XPB</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const locked = item.feature ? !canAccess(item.feature) : false;

              return (
                <li key={item.href}>
                  <Link
                    href={locked ? '#' : item.href}
                    onClick={(e) => {
                      if (locked) e.preventDefault();
                      else setMobileOpen(false);
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors duration-150
                      ${locked
                        ? 'text-text-muted cursor-not-allowed opacity-50'
                        : active
                          ? 'bg-bg-tertiary text-foreground'
                          : 'text-text-secondary hover:bg-bg-secondary hover:text-foreground'
                      }
                    `}
                  >
                    <span className={locked ? 'text-text-muted' : active ? 'text-foreground' : 'text-text-muted'}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {locked && <LockIcon className="text-text-muted" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
              <span className="text-xs font-medium text-text-secondary">JC</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Julian Clarkson</p>
              <p className="text-xs text-text-muted truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
