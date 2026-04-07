'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Types & constants
   ───────────────────────────────────────────────────────── */

type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'fd_theme';

const THEME_META: Record<ThemeMode, { icon: typeof Sun; label: string; next: ThemeMode }> = {
  light: { icon: Sun, label: 'Light mode', next: 'dark' },
  dark: { icon: Moon, label: 'Dark mode', next: 'system' },
  system: { icon: Monitor, label: 'System theme', next: 'light' },
};

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'system') return stored;
  return 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent('fd-theme-change', { detail: mode }));
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Initialize from localStorage
  useEffect(() => {
    const stored = getStoredTheme();
    setMode(stored);
    applyTheme(stored);
  }, []);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

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
      applyTheme(next);
      // Save it to the API in the background
      fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next }),
      }).catch(console.error);
      return next;
    });
  }, []);

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
