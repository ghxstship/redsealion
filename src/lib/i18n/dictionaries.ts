import 'server-only';

import type { SupportedLocale } from './config';

/**
 * Dynamic dictionary loader — imports translation JSON files lazily.
 * Only runs server-side so translation files never enter the client bundle.
 *
 * @module lib/i18n/dictionaries
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Dictionary = Record<string, Record<string, string>>;

const dictionaries: Record<SupportedLocale, () => Promise<Dictionary>> = {
  'en-US': () => import('./dictionaries/en-US.json').then((m) => m.default as any),
  'en-GB': () => import('./dictionaries/en-GB.json').then((m) => m.default as any),
  'en-AU': () => import('./dictionaries/en-AU.json').then((m) => m.default as any),
  'es-ES': () => import('./dictionaries/es-ES.json').then((m) => m.default as any),
  'es-MX': () => import('./dictionaries/es-MX.json').then((m) => m.default as any),
  'fr-FR': () => import('./dictionaries/fr-FR.json').then((m) => m.default as any),
  'de-DE': () => import('./dictionaries/de-DE.json').then((m) => m.default as any),
};

/**
 * Load the dictionary for a given locale.
 * Used in server components (layouts, pages) to resolve translations.
 */
export async function getDictionary(locale: SupportedLocale): Promise<Dictionary> {
  const loader = dictionaries[locale];
  if (!loader) {
    // Fallback to English if somehow an unsupported locale slips through
    return dictionaries['en-US']();
  }
  return loader();
}
