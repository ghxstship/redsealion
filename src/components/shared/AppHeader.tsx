'use client';

import { useState, useCallback } from 'react';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import NotificationBell from '@/components/shared/NotificationBell';
import UserMenu from '@/components/shared/UserMenu';
import QuickActionMenu from '@/components/shared/QuickActionMenu';
import MiniTimer from '@/components/shared/MiniTimer';
import HelpMenu from '@/components/shared/HelpMenu';
import ThemeToggle from '@/components/shared/ThemeToggle';
import KeyboardShortcutsModal from '@/components/shared/KeyboardShortcutsModal';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface AppHeaderProps {
  user: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  orgName: string;
}

/* ─────────────────────────────────────────────────────────
   Search Trigger — opens CommandPalette via ⌘K dispatch
   ───────────────────────────────────────────────────────── */

function SearchTrigger() {
  const handleClick = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true,
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-white/80 px-3 py-1.5 text-sm text-text-muted transition-all duration-fast hover:bg-bg-secondary hover:border-text-muted/40 hover:text-text-secondary press-scale"
      id="global-search-trigger"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="6" cy="6" r="4.5" />
        <line x1="9.5" y1="9.5" x2="13" y2="13" />
      </svg>
      <span className="hidden lg:inline">Search…</span>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted ml-2">
        ⌘K
      </kbd>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   AppHeader Component
   ───────────────────────────────────────────────────────── */

export default function AppHeader({ user, orgName }: AppHeaderProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center gap-3 h-14 px-6 md:px-10 glass-nav"
        role="banner"
        id="app-header"
      >
        {/* Left — Breadcrumbs */}
        <div className="hidden md:flex items-center min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        {/* Mobile — Org name fallback */}
        <div className="flex md:hidden items-center min-w-0 flex-1">
          <span className="text-sm font-semibold text-foreground truncate">
            {orgName}
          </span>
        </div>

        {/* Center — Search */}
        <SearchTrigger />

        {/* Right — Action cluster */}
        <div className="flex items-center gap-1">
          <QuickActionMenu />
          <NotificationBell />
          <MiniTimer />
          <HelpMenu onOpenShortcuts={openShortcuts} />
          <ThemeToggle />

          {/* Divider */}
          <div className="hidden md:block h-5 w-px bg-border/60 mx-1" />

          <UserMenu
            fullName={user.fullName}
            email={user.email}
            role={user.role}
            avatarUrl={user.avatarUrl}
          />
        </div>
      </header>

      {/* Keyboard shortcuts modal (rendered outside header for z-index) */}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
    </>
  );
}
