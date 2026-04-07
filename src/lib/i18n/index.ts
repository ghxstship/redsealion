/**
 * i18n module — barrel export.
 *
 * Server components: import { getDictionary } from '@/lib/i18n/dictionaries'
 * Client components: import { useTranslation, useLocale } from '@/lib/i18n/client'
 * Config:            import { SUPPORTED_LOCALES, ... } from '@/lib/i18n/config'
 * Formatters:        import { formatLocalizedDate, ... } from '@/lib/i18n/formatters'
 *
 * @module lib/i18n
 */

// Re-export config
export {
  SUPPORTED_LOCALES,
  LOCALE_VALUES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_STORAGE_KEY,
  hasLocale,
  getLocaleLabel,
  normalizeBareCode,
  type SupportedLocale,
} from './config';

// Re-export formatters
export {
  formatLocalizedDate,
  formatDateWithPreference,
  formatLocalizedNumber,
  formatLocalizedCurrency,
  formatLocalizedRelativeTime,
} from './formatters';
