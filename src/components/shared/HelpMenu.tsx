'use client';

import { useState, useEffect, useRef } from 'react';
import { LifeBuoy, Keyboard, BookOpen, Sparkles, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface HelpMenuItem {
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  action: 'shortcuts' | 'docs' | 'changelog' | 'support';
}

const helpItems: HelpMenuItem[] = [
  {
    labelKey: 'help.keyboardShortcuts',
    descriptionKey: '',
    icon: <Keyboard size={16} />,
    action: 'shortcuts',
  },
  {
    labelKey: 'help.documentation',
    descriptionKey: '',
    icon: <BookOpen size={16} />,
    action: 'docs',
  },
  {
    labelKey: 'help.changelog',
    descriptionKey: '',
    icon: <Sparkles size={16} />,
    action: 'changelog',
  },
  {
    labelKey: 'help.contactSupport',
    descriptionKey: '',
    icon: <HelpCircle size={16} />,
    action: 'support',
  },
];

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

interface HelpMenuProps {
  onOpenShortcuts: () => void;
}

export default function HelpMenu({ onOpenShortcuts }: HelpMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // ? key listener (when no input/textarea focused)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        onOpenShortcuts();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpenShortcuts]);

  const handleAction = (action: HelpMenuItem['action']) => {
    setOpen(false);
    switch (action) {
      case 'shortcuts':
        onOpenShortcuts();
        break;
      case 'docs':
        window.open('https://docs.flytedeck.io', '_blank', 'noopener');
        break;
      case 'changelog':
        window.open('https://flytedeck.io/changelog', '_blank', 'noopener');
        break;
      case 'support':
        window.open('mailto:support@flytedeck.io', '_blank', 'noopener');
        break;
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-bg-secondary"
        aria-label="Help & Resources"
        id="help-menu-trigger"
      >
        <LifeBuoy size={18} className="text-text-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border bg-background shadow-lg animate-scale-in overflow-hidden z-50">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('help.helpSupport')}
          </p>
          <div className="py-1">
            {helpItems.map((item) => (
              <button
                key={item.action}
                onClick={() => handleAction(item.action)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-secondary group"
              >
                <span className="shrink-0 text-text-muted group-hover:text-text-secondary">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-secondary group-hover:text-foreground">
                    {t(item.labelKey)}
                  </p>
                </div>
                {item.action === 'shortcuts' && (
                  <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                    ?
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}
