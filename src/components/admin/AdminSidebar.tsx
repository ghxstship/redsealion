'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useSubscription } from '@/components/shared/SubscriptionProvider';
import { LockIcon } from '@/components/shared/TierBadge';
import { navSections } from '@/components/admin/sidebar/nav-data';
import { useTranslation } from '@/lib/i18n/client';
import { Settings, ChevronRight, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { usePreferencesSafe } from '@/components/shared/PreferencesProvider';
import { ROLE_LABELS } from '@/config/roles';
import { getInitials } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface AdminSidebarProps {
  user?: {
    fullName: string;
    role: string;
    avatarUrl: string | null;
  };
}

/* ─────────────────────────────────────────────────────────
   Icons (shared)
   ───────────────────────────────────────────────────────── */

const ChevronIcon = ({ open }: { open: boolean }) => (
  <ChevronRight
    size={14}
    className={`shrink-0 transition-transform duration-fast ${open ? 'rotate-90' : ''}`}
  />
);

/* ─────────────────────────────────────────────────────────
   localStorage helpers
   ───────────────────────────────────────────────────────── */

const COLLAPSE_KEY = 'fd_sidebar_collapsed';

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
  } catch (error) {
      void error; /* Caught: error boundary handles display */
    }
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canAccess } = useSubscription();
  const { t } = useTranslation();
  const prefs = usePreferencesSafe();

  // Global sidebar rail collapse — initialized from DB preference
  const [isRailMode, setIsRailMode] = useState(false);

  // Sync from preferences when loaded (only once)
  const [prefSynced, setPrefSynced] = useState(false);
  if (prefs.loaded && !prefSynced) {
    setPrefSynced(true);
    if (prefs.sidebarCollapsed) setIsRailMode(true);
  }

  // Set canonical --sidebar-width CSS variable on <html> for layout consumption
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isRailMode ? '4rem' : '16rem'
    );
  }, [isRailMode]);

  // Section collapse state — default all open, persist to localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(readCollapsed);

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
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg border border-border bg-background p-2 shadow-sm"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
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
          fixed top-0 left-0 z-40 h-screen
          ${isRailMode ? 'w-16' : 'w-64'}
          bg-background/80 backdrop-blur-xl backdrop-saturate-150
          border-r border-border/60
          flex flex-col
          transition-all duration-normal ease-in-out
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0 !w-64' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground shrink-0">
            <span className="text-background text-xs font-semibold tracking-tight">FD</span>
          </div>
          {(!isRailMode || mobileOpen) && (
            <span className="text-base font-semibold tracking-tight text-foreground">FlyteDeck</span>
          )}
          {/* Rail toggle — desktop only */}
          <button
            onClick={() => setIsRailMode(!isRailMode)}
            className="ml-auto hidden md:flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-bg-secondary text-text-muted hover:text-text-secondary"
            aria-label={isRailMode ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isRailMode ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isRailMode ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
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
                    <span className="flex-1 text-left">{t(section.labelKey)}</span>
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
                              <span className="flex-1">{t(item.labelKey)}</span>
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

        {/* User identity + Settings shortcut */}
        <div className="border-t border-border px-3 py-3">
          <Link
            href="/app/settings"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-bg-secondary group"
          >
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.fullName}
                width={28}
                height={28}
                unoptimized
                className="h-7 w-7 rounded-full object-cover ring-1 ring-border/60 shrink-0"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background shrink-0">
                {user ? getInitials(user.fullName) : 'FD'}
              </div>
            )}
            <div className="min-w-0 flex-1 hidden lg:block">
              <p className="text-xs font-medium text-text-secondary truncate group-hover:text-foreground">
                {user?.fullName || 'FlyteDeck'}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {user ? (ROLE_LABELS[user.role] || user.role) : ''}
              </p>
            </div>
            <Settings size={14} className="shrink-0 text-text-muted group-hover:text-text-secondary" />
          </Link>
        </div>
      </aside>
    </>
  );
}
