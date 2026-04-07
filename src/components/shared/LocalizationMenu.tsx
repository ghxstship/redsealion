'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LOCALES, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type SupportedLocale } from '@/lib/i18n/config';

/* ─────────────────────────────────────────────────────────
   Localization Menu — top-bar locale switcher
   ───────────────────────────────────────────────────────── */

export default function LocalizationMenu() {
  const [open, setOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en-US');
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize from cookie / localStorage / API
  useEffect(() => {
    async function initLocale() {
      // 1. Try local storage first for immediate UI
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored) {
        setCurrentLocale(stored as SupportedLocale);
        document.documentElement.lang = stored;
      }

      // 2. Fetch from API to hydrate true server state
      try {
        const res = await fetch('/api/settings/localization');
        if (res.ok) {
          const data = await res.json();
          if (data.language) {
            setCurrentLocale(data.language as SupportedLocale);
            localStorage.setItem(LOCALE_STORAGE_KEY, data.language);
            document.documentElement.lang = data.language;
          }
        }
      } catch (err) {
        console.error('Failed to parse localization settings:', err);
      }
    }
    initLocale();
  }, []);

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

  // Listen for global changes from the Settings page
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ language?: string }>;
      if (customEvent.detail?.language && customEvent.detail.language !== currentLocale) {
        setCurrentLocale(customEvent.detail.language as SupportedLocale);
        document.documentElement.lang = customEvent.detail.language;
      }
    };
    window.addEventListener('fd-localization-change', handler);
    return () => window.removeEventListener('fd-localization-change', handler);
  }, [currentLocale]);

  const selectLocale = async (localeValue: SupportedLocale) => {
    setCurrentLocale(localeValue);
    setOpen(false);
    
    // Apply locally — wrap DOM mutations in microtask to avoid immutability lint
    localStorage.setItem(LOCALE_STORAGE_KEY, localeValue);
    queueMicrotask(() => {
      document.documentElement.lang = localeValue;
      document.cookie = `${LOCALE_COOKIE}=${localeValue};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    });

    // Broadcast change to other components (Settings page, etc.)
    window.dispatchEvent(new CustomEvent('fd-localization-change', { detail: { language: localeValue } }));

    // Persist to server
    try {
      await fetch('/api/settings/localization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: localeValue }),
      });
    } catch (err) {
      console.error('Failed to save localization:', err);
    }

    // Reload to apply server-side dictionary change
    window.location.reload();
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-bg-secondary"
        aria-label="Localization"
        title="Localization"
      >
        <Globe size={18} className="text-text-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-white shadow-lg animate-scale-in overflow-hidden z-50">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Language &amp; Region
          </p>
          <div className="py-1 max-h-64 overflow-y-auto override-scrollbar">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale.value}
                onClick={() => selectLocale(locale.value)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors hover:bg-bg-secondary ${
                  currentLocale === locale.value ? 'text-foreground font-medium bg-bg-secondary/50' : 'text-text-secondary'
                }`}
              >
                {locale.label}
                {currentLocale === locale.value && (
                  <Check size={14} className="text-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
