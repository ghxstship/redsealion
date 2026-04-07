'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface UserMenuProps {
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin',
  project_manager: 'Project Manager',
  designer: 'Designer',
  fabricator: 'Fabricator',
  installer: 'Installer',
  client_primary: 'Client',
  client_viewer: 'Client Viewer',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function UserMenu({ fullName, email, role, avatarUrl }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleSignOut = async () => {
    setOpen(false);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const initials = getInitials(fullName);
  const roleLabel = ROLE_LABELS[role] ?? role;

  const menuLinks = [
    { label: 'Profile', href: '/app/settings/profile', icon: ProfileIcon },
    { label: 'Settings', href: '/app/settings', icon: SettingsIcon },
    { label: 'Plans & Billing', href: '/app/settings/billing', icon: BillingIcon },
  ];

  return (
    <div ref={panelRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full transition-all duration-fast hover:ring-2 hover:ring-border focus-ring"
        aria-label="User menu"
        id="user-menu-trigger"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-border/60"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-white ring-1 ring-foreground/20">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-white shadow-lg animate-scale-in overflow-hidden z-50">
          {/* Identity header */}
          <div className="px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-border/60"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                <p className="text-xs text-text-muted truncate">{email}</p>
              </div>
            </div>
            <span className="mt-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted bg-bg-secondary">
              {roleLabel}
            </span>
          </div>

          {/* Menu links */}
          <div className="py-1">
            {menuLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-secondary hover:text-foreground"
              >
                <item.icon />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Divider + Sign Out */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              id="sign-out-button"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────────────────── */

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 14c0-2.5 2.2-4 5-4s5 1.5 5 4" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <rect x="1" y="3" width="14" height="10" rx="1.5" />
      <path d="M1 6.5h14" />
      <path d="M4 10h3" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2v1M8 13v1M12.2 3.8l-.7.7M4.5 11.5l-.7.7M14 8h-1M3 8H2M12.2 12.2l-.7-.7M4.5 4.5l-.7-.7" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
      <polyline points="10 11 14 8 10 5" />
      <line x1="14" y1="8" x2="6" y2="8" />
    </svg>
  );
}
