'use client';

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import type { SupportedLocale } from './config';
import { DEFAULT_LOCALE } from './config';

/**
 * i18n Client Provider — provides translation and formatting to client components.
 *
 * The dictionary is loaded server-side and passed down as a serializable prop.
 * Client components use `useTranslation()` to access `t()`.
 *
 * @module lib/i18n/client
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DictionaryValue = string | Record<string, string | Record<string, string>>;
export type Dictionary = Record<string, Record<string, DictionaryValue>>;

interface I18nContextValue {
  locale: SupportedLocale;
  dictionary: Dictionary;
  t: (key: string, params?: Record<string, string | number>) => string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface I18nProviderProps {
  locale: SupportedLocale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  /**
   * Translation function `t()`.
   *
   * Supports dot-notation keys like `t('nav.dashboard')` and simple
   * interpolation: `t('table.rowsSelected', { count: 5 })`.
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const parts = key.split('.');
      if (parts.length < 2 || parts.length > 3) return key;

      const [namespace, messageKey, subKey] = parts;
      const entry = dictionary[namespace]?.[messageKey];

      let value: string | undefined;

      if (typeof entry === 'string') {
        // 2-level key: namespace.key
        value = entry;
      } else if (entry && typeof entry === 'object' && subKey) {
        // 3-level key: namespace.group.key
        const nested = entry[subKey];
        if (typeof nested === 'string') value = nested;
      }

      if (!value) return key; // Fallback to the key itself — visible in dev

      if (!params) return value;

      // Simple interpolation: replace {name} tokens
      return value.replace(/\{(\w+)\}/g, (_: string, token: string) =>
        params[token] !== undefined ? String(params[token]) : `{${token}}`
      );
    },
    [dictionary]
  );

  const contextValue = useMemo(
    () => ({ locale, dictionary, t }),
    [locale, dictionary, t]
  );

  return <I18nContext value={contextValue}>{children}</I18nContext>;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Returns the `t()` translation function and current locale.
 *
 * Usage:
 * ```tsx
 * const { t } = useTranslation();
 * return <button>{t('common.save')}</button>;
 * ```
 */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (e.g. portal, marketing)
    return {
      locale: DEFAULT_LOCALE,
      t: (key: string) => {
        // Return the last segment as a readable fallback
        const parts = key.split('.');
        return parts[parts.length - 1] ?? key;
      },
    };
  }
  return { locale: ctx.locale, t: ctx.t };
}

/**
 * Returns the current locale string.
 */
export function useLocale(): SupportedLocale {
  const ctx = useContext(I18nContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
