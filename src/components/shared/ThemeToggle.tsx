'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { usePreferences } from '@/components/shared/PreferencesProvider';

/* ─────────────────────────────────────────────────────────
   Types & constants
   ───────────────────────────────────────────────────────── */

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_META: Record<ThemeMode, { icon: typeof Sun; label: string; next: ThemeMode }> = {
  light: { icon: Sun, label: 'Light mode', next: 'dark' },
  dark: { icon: Moon, label: 'Dark mode', next: 'system' },
  system: { icon: Monitor, label: 'System theme', next: 'light' },
};

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function ThemeToggle() {
  const prefs = usePreferences();
  const [mode, setMode] = useState<ThemeMode>(prefs.theme);

  // Sync from provider when the preference value changes
  const currentTheme = prefs.loaded ? prefs.theme : mode;
  if (currentTheme !== mode) {
    setMode(currentTheme);
  }

  // Listen for global theme changes (e.g. from settings page)
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail && customEvent.detail !== mode) {
        setMode(customEvent.detail);
      }
    };
    window.addEventListener('fd-theme-change', handler);
    return () => window.removeEventListener('fd-theme-change', handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next = THEME_META[prev].next;
      prefs.setTheme(next);
      // Persist to API in the background
      fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      }).catch(console.error);
      return next;
    });
  }, [prefs]);

  const meta = THEME_META[mode];
  const Icon = meta.icon;

  return (
    <button
      onClick={cycle}
      className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-bg-secondary"
      aria-label={meta.label}
      title={meta.label}
      id="theme-toggle"
    >
      <Icon size={18} className="text-text-secondary" />
    </button>
  );
}
