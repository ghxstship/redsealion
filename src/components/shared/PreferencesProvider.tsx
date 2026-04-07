'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

type ThemeMode = 'light' | 'dark' | 'system';
type CalendarView = 'month' | 'week' | 'day';
type Density = 'comfortable' | 'compact';

interface Preferences {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  defaultCalendarView: CalendarView;
  density: Density;
  loaded: boolean;
}

interface PreferencesContextValue extends Preferences {
  setTheme: (mode: ThemeMode) => void;
  setDensity: (density: Density) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDefaultCalendarView: (view: CalendarView) => void;
  /** Persist current preferences to the API */
  save: () => Promise<void>;
}

const THEME_KEY = 'fd_theme';
const DENSITY_KEY = 'fd_density';

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', resolved);
  localStorage.setItem(THEME_KEY, mode);
  window.dispatchEvent(new CustomEvent('fd-theme-change', { detail: mode }));
}

function applyDensityToDOM(density: Density) {
  document.documentElement.setAttribute('data-density', density);
  localStorage.setItem(DENSITY_KEY, density);
}

/* ─────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────── */

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}

/**
 * Optional hook that returns defaults when used outside a provider
 * (e.g. in the portal layout which doesn't have PreferencesProvider).
 */
export function usePreferencesSafe(): Preferences {
  const ctx = useContext(PreferencesContext);
  return ctx ?? {
    theme: 'system',
    sidebarCollapsed: false,
    defaultCalendarView: 'month',
    density: 'comfortable',
    loaded: false,
  };
}

/* ─────────────────────────────────────────────────────────
   Provider
   ───────────────────────────────────────────────────────── */

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [defaultCalendarView, setDefaultCalendarViewState] = useState<CalendarView>('month');
  const [density, setDensityState] = useState<Density>('comfortable');
  const [loaded, setLoaded] = useState(false);

  // Fetch from API on mount
  useEffect(() => {
    fetch('/api/settings/appearance')
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) {
          setThemeState(data.theme);
          applyThemeToDOM(data.theme);
        }
        if (typeof data.sidebar_collapsed === 'boolean') {
          setSidebarCollapsedState(data.sidebar_collapsed);
        }
        if (data.default_calendar_view) {
          setDefaultCalendarViewState(data.default_calendar_view);
        }
        if (data.density) {
          setDensityState(data.density);
          applyDensityToDOM(data.density);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeToDOM('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeToDOM(mode);
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    applyDensityToDOM(d);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
  }, []);

  const setDefaultCalendarView = useCallback((view: CalendarView) => {
    setDefaultCalendarViewState(view);
  }, []);

  const save = useCallback(async () => {
    await fetch('/api/settings/appearance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme,
        sidebar_collapsed: sidebarCollapsed,
        default_calendar_view: defaultCalendarView,
        density,
      }),
    });
  }, [theme, sidebarCollapsed, defaultCalendarView, density]);

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        sidebarCollapsed,
        defaultCalendarView,
        density,
        loaded,
        setTheme,
        setDensity,
        setSidebarCollapsed,
        setDefaultCalendarView,
        save,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
