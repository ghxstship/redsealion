/**
 * Locale-aware formatting utilities.
 *
 * These functions replace hardcoded 'en-US' calls throughout the codebase,
 * accepting a locale parameter that defaults to 'en-US' for backward compat.
 *
 * @module lib/i18n/formatters
 */

import type { SupportedLocale } from './config';

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string to a human-readable short format.
 * Respects the given locale for month names, ordering, etc.
 */
export function formatLocalizedDate(
  dateStr: string,
  locale: SupportedLocale = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = dateStr.includes('T')
    ? new Date(dateStr)
    : new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString(locale, options ?? {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date using the org's explicit date format preference (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD).
 */
export function formatDateWithPreference(
  dateStr: string,
  dateFormat: string = 'MM/DD/YYYY'
): string {
  const d = dateStr.includes('T')
    ? new Date(dateStr)
    : new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';

  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();

  switch (dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${m}/${y}`;
    case 'YYYY-MM-DD':
      return `${y}-${m}-${day}`;
    default:
      return `${m}/${day}/${y}`;
  }
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number with the given locale's grouping and decimal conventions.
 */
export function formatLocalizedNumber(
  num: number,
  locale: SupportedLocale = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

/**
 * Format a monetary amount with locale-aware grouping, symbol, and decimals.
 */
export function formatLocalizedCurrency(
  amount: number,
  currency: string = 'USD',
  locale: SupportedLocale = 'en-US',
  options?: Partial<Intl.NumberFormatOptions>
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

/**
 * Format a date as relative time, locale-aware.
 * Uses Intl.RelativeTimeFormat for proper localization.
 */
export function formatLocalizedRelativeTime(
  date: string | Date,
  locale: SupportedLocale = 'en-US'
): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (seconds < 60) return rtf.format(0, 'second'); // "just now" / "ahora mismo"
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    if (hours < 24) return rtf.format(-hours, 'hour');
    if (days < 7) return rtf.format(-days, 'day');

    return d.toLocaleDateString(locale);
  } catch {
    // Fallback for environments without RelativeTimeFormat
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }
}
