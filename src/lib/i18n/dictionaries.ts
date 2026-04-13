import 'server-only';

import type { SupportedLocale } from './config';

/**
 * Dynamic dictionary loader — imports translation JSON files lazily.
 * Only runs server-side so translation files never enter the client bundle.
 *
 * @module lib/i18n/dictionaries
 */

type Dictionary = Record<string, Record<string, string>>;

/** Bounded type assertion for JSON dictionary imports. */
function asDictionary(mod: { default: unknown }): Dictionary {
  return mod.default as Dictionary;
}

const dictionaries: Record<SupportedLocale, () => Promise<Dictionary>> = {
  'en-US': () => import('./dictionaries/en-US.json').then(asDictionary),
  'en-GB': () => import('./dictionaries/en-GB.json').then(asDictionary),
  'en-AU': () => import('./dictionaries/en-AU.json').then(asDictionary),
  'es-ES': () => import('./dictionaries/es-ES.json').then(asDictionary),
  'es-MX': () => import('./dictionaries/es-MX.json').then(asDictionary),
  'fr-FR': () => import('./dictionaries/fr-FR.json').then(asDictionary),
  'de-DE': () => import('./dictionaries/de-DE.json').then(asDictionary),
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
