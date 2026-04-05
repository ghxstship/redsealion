'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { LockIcon } from '@/components/shared/TierBadge';
import { navSections } from '@/components/admin/sidebar/nav-data';

/* ─────────────────────────────────────────────────────────
   Icons (shared)
   ───────────────────────────────────────────────────────── */

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 transition-transform duration-fast ${open ? 'rotate-90' : ''}`}
  >
    <path d="M5 3l4 4-4 4" />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   localStorage helpers
   ───────────────────────────────────────────────────────── */

const COLLAPSE_KEY = 'fd_sidebar_collapsed';

function readCollapsed(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function writeCollapsed(state: Record<string, boolean>) {
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
  } catch (error) {
      void error; /* Caught: error boundary handles display */
    }
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canAccess } = useSubscription();

  // Section collapse state — default all open, persist to localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      writeCollapsed(next);
      return next;
    });
  }, []);

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  };

  // Determine which section contains the active route (for auto-expand)
  const activeSectionId = navSections.find((section) =>
    section.items.some((item) => isActive(item.href))
  )?.id;

  const isSectionOpen = (sectionId: string) => {
    // If this section has the active route, always show it open
    if (activeSectionId === sectionId) return true;
    // Otherwise respect the user's collapse preference
    return !collapsed[sectionId];
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
          className="fixed inset-0 z-30 bg-black/20 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          bg-white/80 backdrop-blur-xl backdrop-saturate-150
          border-r border-border/60
          flex flex-col
          transition-transform duration-normal ease-in-out
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
            <span className="text-white text-xs font-semibold tracking-tight">FD</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">FlyteDeck</span>
        </div>

        {/* Navigation — grouped sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navSections.map((section) => {
              const open = isSectionOpen(section.id);

              return (
                <div key={section.id}>
                  {/* Section header */}
                  <button
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
                  </button>

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

                        return (
                          <li key={item.href}>
                            <Link
                              href={locked ? '#' : item.href}
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

        {/* Minimal indicator — full identity in AppHeader UserMenu */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center">
            <span className="text-[10px] font-medium text-text-secondary">⚙</span>
          </div>
        </div>
      </aside>
    </>
  );
}
