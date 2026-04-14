/**
 * i18n configuration — single source of truth for supported locales.
 *
 * All locale definitions used by LocalizationMenu, Settings, middleware,
 * and the dictionary loader are derived from this file.
 *
 * @module lib/i18n/config
 */

// ---------------------------------------------------------------------------
// Supported locales (BCP-47)
// ---------------------------------------------------------------------------

export const SUPPORTED_LOCALES = [
  { value: 'en-US', label: 'English (US)', flag: 'US' },
  { value: 'en-GB', label: 'English (UK)', flag: 'GB' },
  { value: 'en-AU', label: 'English (AU)', flag: 'AU' },
  { value: 'es-ES', label: 'Español (ES)', flag: 'ES' },
  { value: 'es-MX', label: 'Español (MX)', flag: 'MX' },
  { value: 'fr-FR', label: 'Français', flag: 'FR' },
  { value: 'de-DE', label: 'Deutsch', flag: 'DE' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['value'];

const LOCALE_VALUES: SupportedLocale[] = SUPPORTED_LOCALES.map((l) => l.value);

export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

export const LOCALE_COOKIE = 'fd_locale';
export const LOCALE_HEADER = 'x-fd-locale';
export const LOCALE_STORAGE_KEY = 'fd_locale';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type guard — narrows a string to SupportedLocale. */
export function hasLocale(locale: string): locale is SupportedLocale {
  return LOCALE_VALUES.includes(locale as SupportedLocale);
}

/** Get the display label for a locale. */
function getLocaleLabel(locale: string): string {
  const entry = SUPPORTED_LOCALES.find((l) => l.value === locale);
  return entry?.label ?? locale;
}

/**
 * Map a bare language code (e.g. 'en', 'fr') to the default BCP-47 locale.
 * Used for backward compatibility with the old settings page.
 */
export function normalizeBareCode(code: string): SupportedLocale {
  if (hasLocale(code)) return code;

  const BARE_MAP: Record<string, SupportedLocale> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'en-US', // No Japanese dictionary yet — fallback
    pt: 'en-US', // No Portuguese dictionary yet — fallback
  };

  return BARE_MAP[code] ?? DEFAULT_LOCALE;
}
