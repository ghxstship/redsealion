'use client';

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Settings, Plus, Search } from 'lucide-react';
import { navSections, type NavItem } from '@/components/admin/sidebar/nav-data';


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
   Keyword supplements — extra search terms for sidebar items
   (keyed by href for lookup from navSections).
   ───────────────────────────────────────────────────────── */

const keywordsByHref: Record<string, string[]> = {
  '/app': ['home', 'overview'],
  '/app/ai': ['chat', 'copilot'],
  '/app/leads': ['prospects', 'crm'],
  '/app/pipeline': ['deals', 'funnel', 'sales'],
  '/app/clients': ['customers', 'accounts'],
  '/app/proposals': ['quotes', 'estimates', 'bids'],
  '/app/tasks': ['todo', 'checklist'],
  '/app/calendar': ['schedule', 'events'],
  '/app/workloads': ['capacity', 'scheduling'],
  '/app/templates': ['presets', 'phase templates'],
  '/app/dispatch': ['work orders', 'field'],
  '/app/people': ['team', 'hr', 'directory', 'staff', 'employees'],
  '/app/crew': ['freelancers', 'contractors'],
  '/app/equipment': ['gear', 'tools', 'inventory'],
  '/app/invoices': ['billing', 'payments'],
  '/app/expenses': ['receipts', 'reimbursement'],
  '/app/budgets': ['cost', 'forecast'],
  '/app/profitability': ['margin', 'profit', 'loss'],
  '/app/time': ['hours', 'timesheet', 'clock'],
  '/app/reports': ['analytics', 'charts', 'data'],
  '/app/automations': ['workflows', 'rules'],
  '/app/campaigns': ['marketing', 'email blasts'],
  '/app/emails': ['inbox', 'mail'],
  '/app/integrations': ['connect', 'sync', 'api'],
  '/app/assets': ['inventory', 'physical'],
  '/app/logistics': ['warehouse', 'storage', 'logistics', 'shipping', 'receiving'],
  '/app/portfolio': ['showcase', 'gallery', 'work'],
  '/app/terms': ['legal', 'contract'],
  '/app/settings': ['preferences', 'config'],
  '/app/favorites': ['bookmarks', 'starred'],
  '/app/my-schedule': ['personal', 'calendar'],
  '/app/my-tasks': ['personal', 'assigned'],
  '/app/my-inbox': ['notifications', 'mentions'],
  '/app/my-documents': ['personal', 'files', 'upload'],
  '/app/goals': ['okr', 'objectives'],
  '/app/roadmap': ['timeline', 'milestones'],
  '/app/files': ['documents', 'uploads'],
  '/app/events': ['shows', 'gigs', 'performances'],
  '/app/locations': ['venues', 'sites'],
  '/app/advancing': ['advance', 'prep', 'fabrication', 'procurement', 'rentals', 'fulfillment', 'build', 'purchase', 'rent'],
  '/app/manifest': ['packing', 'load list', 'fulfillment', 'build', 'purchase', 'rent', 'internal'],
  '/app/schedule': ['production calendar'],
  '/app/work-orders': ['service', 'dispatch'],
  '/app/marketplace': ['store', 'marketplace'],
  '/app/compliance': ['documents', 'insurance', 'licenses'],
  '/app/finance': ['money', 'financials'],
  '/app/portal': ['preview', 'client portal', 'demo'],
};

/* ─────────────────────────────────────────────────────────
   Derive navigation items from navSections (SSOT)
   ───────────────────────────────────────────────────────── */

function buildNavigationItems(): CommandItem[] {
  const items: CommandItem[] = [];
  for (const section of navSections) {
    for (const item of section.items) {
      items.push({
        id: `nav-${item.href.replace(/\//g, '-').slice(1)}`,
        label: item.label,
        section: 'Navigate',
        href: item.href,
        icon: <NavIcon />,
        keywords: keywordsByHref[item.href] ?? [],
      });
    }
  }
  return items;
}

/* ─────────────────────────────────────────────────────────
   Settings sub-pages (not in sidebar — supplemental registry)
   ───────────────────────────────────────────────────────── */

const settingsItems: CommandItem[] = [
  { id: 'nav-settings', label: 'Settings', section: 'Navigate', href: '/app/settings', icon: <NavIcon />, keywords: ['preferences', 'config'] },
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
];

/* ─────────────────────────────────────────────────────────
   Quick action items (supplemental — not derived from sidebar)
   ───────────────────────────────────────────────────────── */

const actionItems: CommandItem[] = [
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
  return <ChevronRight size={16} className="shrink-0 text-text-muted" />;
}

function SettingsIcon() {
  return <Settings size={16} className="shrink-0 text-text-muted" />;
}

function ActionIcon() {
  return <Plus size={16} className="shrink-0 text-text-muted" />;
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

  // Build the complete items list — derived from navSections (SSOT) + supplemental
  const allItems = useMemo(() => {
    return [...buildNavigationItems(), ...settingsItems, ...actionItems];
  }, []);

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
    if (!query.trim()) return allItems.slice(0, 12); // show top items when empty
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.includes(q))
    );
  }, [query, allItems]);

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
        className="fixed inset-0 bg-black/40 animate-modal-backdrop"
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl animate-modal-content overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search size={18} className="shrink-0 text-text-muted" />
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
