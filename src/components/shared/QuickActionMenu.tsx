'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────
   Quick-action items
   ───────────────────────────────────────────────────────── */

const quickActions = [
  {
    label: 'New Proposal',
    href: '/app/proposals/new',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <path d="M4 2h6l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
        <path d="M10 2v4h4" />
      </svg>
    ),
  },
  {
    label: 'New Client',
    href: '/app/clients?action=new',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <circle cx="7" cy="5.5" r="2.5" />
        <path d="M2 14c0-2.5 2.2-4 5-4s5 1.5 5 4" />
        <line x1="13" y1="4" x2="13" y2="8" />
        <line x1="11" y1="6" x2="15" y2="6" />
      </svg>
    ),
  },
  {
    label: 'New Invoice',
    href: '/app/invoices/new',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <path d="M5 6h6M5 8.5h4M5 11h2" />
      </svg>
    ),
  },
  {
    label: 'Log Time',
    href: '/app/time/timer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
        <circle cx="8" cy="8.5" r="5.5" />
        <polyline points="8 5.5 8 8.5 10.5 10" />
        <line x1="8" y1="1" x2="8" y2="3" />
      </svg>
    ),
  },
];

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function QuickActionMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-white transition-all duration-fast hover:bg-bg-secondary hover:border-text-muted/30 press-scale"
        aria-label="Quick actions"
        id="quick-action-trigger"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-text-secondary"
        >
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-white shadow-lg animate-scale-in overflow-hidden z-50">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Create
          </p>
          <div className="py-1">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-foreground"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
