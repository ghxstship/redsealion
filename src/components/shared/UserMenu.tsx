'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, CreditCard, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/client';

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
  developer: 'Developer',
  owner: 'Owner',
  admin: 'Admin',
  controller: 'Controller',
  collaborator: 'Collaborator',
  contractor: 'Contractor',
  crew: 'Crew',
  client: 'Client',
  viewer: 'Viewer',
  community: 'Community',
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
  const { t } = useTranslation();

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
  const ROLE_KEY_MAP: Record<string, string> = {
    developer: 'user.developer',
    owner: 'user.owner',
    admin: 'user.admin',
    controller: 'user.controller',
    collaborator: 'user.collaborator',
    contractor: 'user.contractor',
    crew: 'user.crew',
    client: 'user.client',
    viewer: 'user.viewer',
    community: 'user.community',
  };
  const roleLabel = ROLE_KEY_MAP[role] ? t(ROLE_KEY_MAP[role]) : (ROLE_LABELS[role] ?? role);

  const menuLinks = [
    { label: t('user.profile'), href: '/app/settings/profile', icon: ProfileIcon },
    { label: t('user.settings'), href: '/app/settings', icon: SettingsIcon },
    { label: 'Plans & Billing', href: '/app/settings/billing', icon: BillingIcon },
  ];

  return (
    <div ref={panelRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full transition-all duration-fast hover:ring-2 hover:ring-border focus-ring"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-dropdown"
        id="user-menu-trigger"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName}
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 rounded-full object-cover ring-1 ring-border/60"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background ring-1 ring-foreground/20">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div 
          id="user-menu-dropdown"
          role="menu"
          aria-labelledby="user-menu-trigger"
          className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-background shadow-lg animate-scale-in overflow-hidden z-50"
        >
          {/* Identity header */}
          <div className="px-4 py-3.5 border-b border-border">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={fullName}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-border/60"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
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
                role="menuitem"
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
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-500/10"
              id="sign-out-button"
            >
              <SignOutIcon />
              {t('user.signOut')}
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
  return <User size={16} className="shrink-0 text-text-muted" />;
}

function BillingIcon() {
  return <CreditCard size={16} className="shrink-0 text-text-muted" />;
}

function SettingsIcon() {
  return <Settings size={16} className="shrink-0 text-text-muted" />;
}

function SignOutIcon() {
  return <LogOut size={16} className="shrink-0" />;
}
