'use client';

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FeatureKey } from '@/lib/subscription';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface CommandItem {
  id: string;
  label: string;
  section: string;
  href?: string;
  icon: React.ReactNode;
  keywords?: string[];
}

/* ─────────────────────────────────────────────────────────
   Searchable items registry
   ───────────────────────────────────────────────────────── */

const navigationItems: CommandItem[] = [
  // Overview
  { id: 'nav-dashboard', label: 'Dashboard', section: 'Navigate', href: '/app', icon: <NavIcon />, keywords: ['home', 'overview'] },
  { id: 'nav-ai', label: 'AI Assistant', section: 'Navigate', href: '/app/ai', icon: <NavIcon />, keywords: ['chat', 'copilot'] },

  // Sales & CRM
  { id: 'nav-leads', label: 'Leads', section: 'Navigate', href: '/app/leads', icon: <NavIcon />, keywords: ['prospects', 'crm'] },
  { id: 'nav-pipeline', label: 'Pipeline', section: 'Navigate', href: '/app/pipeline', icon: <NavIcon />, keywords: ['deals', 'funnel', 'sales'] },
  { id: 'nav-clients', label: 'Clients', section: 'Navigate', href: '/app/clients', icon: <NavIcon />, keywords: ['customers', 'accounts'] },
  { id: 'nav-proposals', label: 'Proposals', section: 'Navigate', href: '/app/proposals', icon: <NavIcon />, keywords: ['quotes', 'estimates', 'bids'] },

  // Project Delivery
  { id: 'nav-tasks', label: 'Tasks', section: 'Navigate', href: '/app/tasks', icon: <NavIcon />, keywords: ['todo', 'checklist'] },
  { id: 'nav-calendar', label: 'Calendar', section: 'Navigate', href: '/app/calendar', icon: <NavIcon />, keywords: ['schedule', 'events'] },
  { id: 'nav-resources', label: 'Resources', section: 'Navigate', href: '/app/resources', icon: <NavIcon />, keywords: ['capacity', 'scheduling'] },
  { id: 'nav-templates', label: 'Templates', section: 'Navigate', href: '/app/templates', icon: <NavIcon />, keywords: ['presets', 'phase templates'] },

  // People & Crew
  { id: 'nav-people', label: 'People', section: 'Navigate', href: '/app/people', icon: <NavIcon />, keywords: ['team', 'hr', 'directory', 'staff', 'employees'] },
  { id: 'nav-crew', label: 'Crew', section: 'Navigate', href: '/app/crew', icon: <NavIcon />, keywords: ['freelancers', 'contractors'] },
  { id: 'nav-equipment', label: 'Equipment', section: 'Navigate', href: '/app/equipment', icon: <NavIcon />, keywords: ['gear', 'tools', 'inventory'] },

  // Finance
  { id: 'nav-invoices', label: 'Invoices', section: 'Navigate', href: '/app/invoices', icon: <NavIcon />, keywords: ['billing', 'payments'] },
  { id: 'nav-expenses', label: 'Expenses', section: 'Navigate', href: '/app/expenses', icon: <NavIcon />, keywords: ['receipts', 'reimbursement'] },
  { id: 'nav-budgets', label: 'Budgets', section: 'Navigate', href: '/app/budgets', icon: <NavIcon />, keywords: ['cost', 'forecast'] },
  { id: 'nav-profitability', label: 'Profitability', section: 'Navigate', href: '/app/profitability', icon: <NavIcon />, keywords: ['margin', 'profit', 'loss'] },
  { id: 'nav-time', label: 'Time Tracking', section: 'Navigate', href: '/app/time', icon: <NavIcon />, keywords: ['hours', 'timesheet', 'clock'] },

  // Operations
  { id: 'nav-assets', label: 'Assets', section: 'Navigate', href: '/app/assets', icon: <NavIcon />, keywords: ['inventory', 'physical'] },
  { id: 'nav-warehouse', label: 'Warehouse', section: 'Navigate', href: '/app/warehouse', icon: <NavIcon />, keywords: ['storage', 'logistics'] },
  { id: 'nav-portfolio', label: 'Portfolio', section: 'Navigate', href: '/app/portfolio', icon: <NavIcon />, keywords: ['showcase', 'gallery', 'work'] },
  { id: 'nav-terms', label: 'Terms & Conditions', section: 'Navigate', href: '/app/terms', icon: <NavIcon />, keywords: ['legal', 'contract'] },

  // System
  { id: 'nav-automations', label: 'Automations', section: 'Navigate', href: '/app/automations', icon: <NavIcon />, keywords: ['workflows', 'rules'] },
  { id: 'nav-integrations', label: 'Integrations', section: 'Navigate', href: '/app/integrations', icon: <NavIcon />, keywords: ['connect', 'sync', 'api'] },
  { id: 'nav-emails', label: 'Emails', section: 'Navigate', href: '/app/emails', icon: <NavIcon />, keywords: ['inbox', 'mail'] },
  { id: 'nav-reports', label: 'Reports', section: 'Navigate', href: '/app/reports', icon: <NavIcon />, keywords: ['analytics', 'charts', 'data'] },
  { id: 'nav-settings', label: 'Settings', section: 'Navigate', href: '/app/settings', icon: <NavIcon />, keywords: ['preferences', 'config'] },

  // Settings sub-pages
  { id: 'nav-settings-branding', label: 'Branding', section: 'Settings', href: '/app/settings/branding', icon: <SettingsIcon />, keywords: ['logo', 'colors'] },
  { id: 'nav-settings-billing', label: 'Plans & Billing', section: 'Settings', href: '/app/settings/billing', icon: <SettingsIcon />, keywords: ['subscription', 'plan', 'pricing'] },
  { id: 'nav-settings-team', label: 'Team Members', section: 'Settings', href: '/app/settings/team', icon: <SettingsIcon />, keywords: ['invite', 'members', 'roles'] },
  { id: 'nav-settings-notifications', label: 'Notifications', section: 'Settings', href: '/app/settings/notifications', icon: <SettingsIcon />, keywords: ['alerts', 'email'] },
  { id: 'nav-settings-security', label: 'Security', section: 'Settings', href: '/app/settings/security', icon: <SettingsIcon />, keywords: ['password', 'audit', '2fa'] },
  { id: 'nav-settings-appearance', label: 'Appearance', section: 'Settings', href: '/app/settings/appearance', icon: <SettingsIcon />, keywords: ['theme', 'dark mode'] },
  { id: 'nav-settings-localization', label: 'Localization', section: 'Settings', href: '/app/settings/localization', icon: <SettingsIcon />, keywords: ['language', 'timezone', 'currency'] },
  { id: 'nav-settings-profile', label: 'Profile', section: 'Settings', href: '/app/settings/profile', icon: <SettingsIcon />, keywords: ['account', 'personal'] },
  { id: 'nav-settings-apikeys', label: 'API Keys & Webhooks', section: 'Settings', href: '/app/settings/api-keys', icon: <SettingsIcon />, keywords: ['developer', 'tokens'] },
  { id: 'nav-settings-customfields', label: 'Custom Fields', section: 'Settings', href: '/app/settings/custom-fields', icon: <SettingsIcon />, keywords: ['metadata', 'attributes'] },
  { id: 'nav-settings-payments', label: 'Stripe Connect', section: 'Settings', href: '/app/settings/payments', icon: <SettingsIcon />, keywords: ['stripe', 'payout'] },

  // Quick actions
  { id: 'action-new-proposal', label: 'Create Proposal', section: 'Actions', href: '/app/proposals/new', icon: <ActionIcon />, keywords: ['new', 'create', 'add'] },
  { id: 'action-new-invoice', label: 'Create Invoice', section: 'Actions', href: '/app/invoices/new', icon: <ActionIcon />, keywords: ['new', 'create', 'bill'] },
  { id: 'action-new-expense', label: 'New Expense', section: 'Actions', href: '/app/expenses/new', icon: <ActionIcon />, keywords: ['new', 'submit', 'receipt'] },
  { id: 'action-new-deal', label: 'New Deal', section: 'Actions', href: '/app/pipeline', icon: <ActionIcon />, keywords: ['new', 'create', 'opportunity'] },
  { id: 'action-new-lead', label: 'Create Lead Form', section: 'Actions', href: '/app/leads/forms', icon: <ActionIcon />, keywords: ['new', 'capture', 'form'] },
  { id: 'action-new-automation', label: 'New Automation', section: 'Actions', href: '/app/automations/new', icon: <ActionIcon />, keywords: ['new', 'workflow', 'rule'] },
  { id: 'action-log-time', label: 'Log Time', section: 'Actions', href: '/app/time/timer', icon: <ActionIcon />, keywords: ['clock', 'start', 'timer'] },
];

/* ─────────────────────────────────────────────────────────
   Icon helpers
   ───────────────────────────────────────────────────────── */

function NavIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <path d="M5 3l6 5-6 5" />
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

function ActionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 text-text-muted">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      startTransition(() => {
        setQuery('');
        setSelectedIndex(0);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return navigationItems.slice(0, 12); // show top items when empty
    const q = query.toLowerCase();
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.includes(q))
    );
  }, [query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      if (item.href) {
        router.push(item.href);
        setOpen(false);
      }
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) handleSelect(flatItems[selectedIndex]);
      }
    },
    [flatItems, selectedIndex, handleSelect]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-modal-backdrop"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-white shadow-2xl animate-modal-content overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-text-muted"
          >
            <circle cx="8" cy="8" r="5.5" />
            <line x1="12.5" y1="12.5" x2="16" y2="16" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or jump to..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-text-muted">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            grouped.map(([section, items]) => (
              <div key={section}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {section}
                </p>
                {items.map((item) => {
                  const globalIdx = flatItems.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={globalIdx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-bg-tertiary text-foreground'
                          : 'text-text-secondary hover:bg-bg-secondary'
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 font-medium">{item.label}</span>
                      {isSelected && (
                        <kbd className="text-[10px] text-text-muted">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-bg-secondary px-1 py-0.5">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-bg-secondary px-1 py-0.5">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-bg-secondary px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
