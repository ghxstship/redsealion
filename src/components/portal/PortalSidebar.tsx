'use client';
import Button from '@/components/ui/Button';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { LockIcon } from '@/components/shared/TierBadge';
import { navSections } from '@/components/admin/sidebar/nav-data';
import { usePortalContext } from './PortalContext';
import { IconChevronRight, IconMenu, IconX } from '@/components/ui/Icons';
import { ArrowUp } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────────────────── */

const ChevronIcon = ({ open }: { open: boolean }) => (
  <IconChevronRight
    size={14}
    strokeWidth={1.5}
    className={`shrink-0 transition-transform duration-fast ${open ? 'rotate-90' : ''}`}
  />
);

/* ─────────────────────────────────────────────────────────
   localStorage helpers
   ───────────────────────────────────────────────────────── */

const COLLAPSE_KEY = 'fd_portal_sidebar_collapsed';

function readCollapsed(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
  } catch {
    /* Caught: error boundary handles display */
  }
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function PortalSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canAccess } = useSubscription();
  const { orgSlug, orgName } = usePortalContext();

  // Section collapse state — default all open, persist to localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      writeCollapsed(next);
      return next;
    });
  }, []);

  // Rewrite admin hrefs to portal namespace
  const portalHref = (href: string) => {
    // /app/proposals → /portal/{orgSlug}/app/proposals
    if (href.startsWith('/app')) {
      return `/portal/${orgSlug}/app${href.slice(4)}`;
    }
    return href;
  };

  const isActive = (href: string) => {
    const mappedHref = portalHref(href);
    if (mappedHref === `/portal/${orgSlug}/app`) return pathname === `/portal/${orgSlug}/app`;
    return pathname.startsWith(mappedHref);
  };

  // Determine which section contains the active route (for auto-expand)
  const activeSectionId = navSections.find((section) =>
    section.items.some((item) => isActive(item.href))
  )?.id;

  const isSectionOpen = (sectionId: string) => {
    if (activeSectionId === sectionId) return true;
    return !collapsed[sectionId];
  };

  // GAP-PTL-20: Show only portal-relevant sections (not the full admin nav)
  // Only include sections that make sense for a demo/portal context
  const portalAllowedSections = new Set(['overview', 'projects', 'sales', 'finance', 'admin']);
  const portalSections = navSections.filter((s) => portalAllowedSections.has(s.id));

  return (
    <>
      {/* Mobile hamburger button */}
      <Button variant="ghost"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-[calc(2.5rem+6px)] left-4 z-50 md:hidden rounded-lg border border-border bg-background p-2 shadow-sm"
        aria-label="Toggle navigation"
      >
          {mobileOpen ? (
            <IconX size={20} strokeWidth={1.5} />
          ) : (
            <IconMenu size={20} strokeWidth={1.5} />
          )}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          bg-background/80 backdrop-blur-xl backdrop-saturate-150
          border-r border-border/60
          flex flex-col
          transition-transform duration-normal ease-in-out
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand — GAP-PTL-39: Use org branding instead of hardcoded */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
            <span className="text-white text-xs font-semibold tracking-tight">
              {orgSlug.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">
              {orgName || 'Portal'}
            </span>
            <span className="text-[10px] font-medium text-violet-600 uppercase tracking-wider">Demo</span>
          </div>
        </div>

        {/* Navigation — grouped sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {portalSections.map((section) => {
              const open = isSectionOpen(section.id);

              return (
                <div key={section.id}>
                  {/* Section header */}
                  <Button variant="ghost"
                    onClick={() => toggleSection(section.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider
                      transition-colors duration-fast cursor-pointer select-none
                      ${activeSectionId === section.id
                        ? 'text-foreground'
                        : 'text-text-muted hover:text-text-secondary'
                      }
                    `}
                  >
                    <span className="opacity-60">{section.icon}</span>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronIcon open={open} />
                  </Button>

                  {/* Section items */}
                  <div
                    className={`overflow-hidden transition-all duration-normal ease-in-out ${
                      open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="ml-2 pl-4 border-l border-border/60 space-y-0.5 py-1">
                      {section.items.map((item) => {
                        const active = isActive(item.href);
                        const locked = item.feature ? !canAccess(item.feature) : false;
                        const href = portalHref(item.href);

                        return (
                          <li key={item.href}>
                            <Link
                              href={locked ? '#' : href}
                              onClick={(e) => {
                                if (locked) e.preventDefault();
                                else setMobileOpen(false);
                              }}
                              className={`
                                flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium
                                transition-colors duration-fast
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
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Bottom CTA */}
        <div className="border-t border-border p-4">
          <Link
            href={`/portal/${orgSlug}/pricing`}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ArrowUp size={16} strokeWidth={1.5} />
            Start Free Trial
          </Link>
        </div>
      </aside>
    </>
  );
}
