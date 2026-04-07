/**
 * Multi-currency utilities.
 *
 * Supports currency formatting, conversion, and the canonical list of
 * currencies supported by FlyteDeck.
 *
 * @module lib/currency
 */

// ---------------------------------------------------------------------------
// Supported currencies
// ---------------------------------------------------------------------------

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
];

// ---------------------------------------------------------------------------
// Conversion & Formatting
// ---------------------------------------------------------------------------

/**
 * Convert an amount between currencies given an exchange rate.
 */
export function convertAmount(
  amount: number,
  _fromCurrency: string,
  _toCurrency: string,
  exchangeRate: number,
): number {
  return Math.round(amount * exchangeRate * 100) / 100;
}

/**
 * Format a monetary amount with the correct currency symbol and decimals.
 */
export function formatCurrencyAmount(amount: number, currencyCode: string, locale = 'en-US'): string {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  const decimals = currency?.decimals ?? 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback if Intl doesn't recognize the currency
    const symbol = currency?.symbol ?? currencyCode;
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

/**
 * Get currency info by code.
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}

/**
 * Get a currency select option list for form dropdowns.
 */
export function getCurrencyOptions(): Array<{ value: string; label: string }> {
  return SUPPORTED_CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name} (${c.symbol})`,
  }));
}
