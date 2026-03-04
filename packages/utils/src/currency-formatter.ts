/**
 * Currency Formatter Utility
 * 
 * Provides functions for formatting currency amounts with proper symbols and localization.
 * Supports multiple currencies and locales.
 */

export type SupportedCurrency = 'usd' | 'eur' | 'gbp' | 'cad' | 'aud' | 'jpy' | 'cny' | 'inr' | 'mxn' | 'brl';

export interface CurrencyFormatOptions {
  locale?: string;
  showSymbol?: boolean;
  showCode?: boolean;
}

/**
 * Currency metadata for supported currencies
 */
const CURRENCY_METADATA: Record<SupportedCurrency, { symbol: string; name: string; decimals: number }> = {
  usd: { symbol: '$', name: 'US Dollar', decimals: 2 },
  eur: { symbol: '€', name: 'Euro', decimals: 2 },
  gbp: { symbol: '£', name: 'British Pound', decimals: 2 },
  cad: { symbol: 'CA$', name: 'Canadian Dollar', decimals: 2 },
  aud: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  jpy: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  cny: { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  inr: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  mxn: { symbol: 'MX$', name: 'Mexican Peso', decimals: 2 },
  brl: { symbol: 'R$', name: 'Brazilian Real', decimals: 2 },
};

/**
 * Format currency amount from cents to display string
 * 
 * @param amountCents - Amount in cents (e.g., 2500 for $25.00)
 * @param currency - ISO 4217 currency code (e.g., 'usd', 'eur')
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(2500, 'usd') // "$25.00"
 * formatCurrency(2500, 'eur', { locale: 'de-DE' }) // "25,00 €"
 * formatCurrency(2500, 'gbp', { showCode: true }) // "£25.00 GBP"
 */
export function formatCurrency(
  amountCents: number,
  currency: SupportedCurrency = 'usd',
  options: CurrencyFormatOptions = {}
): string {
  const {
    locale = 'en-US',
    showSymbol = true,
    showCode = false,
  } = options;

  const metadata = CURRENCY_METADATA[currency];
  if (!metadata) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Convert cents to major currency unit
  const amount = amountCents / 100;

  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency.toUpperCase(),
    minimumFractionDigits: metadata.decimals,
    maximumFractionDigits: metadata.decimals,
  });

  let formatted = formatter.format(amount);

  // Append currency code if requested
  if (showCode && !formatted.includes(currency.toUpperCase())) {
    formatted += ` ${currency.toUpperCase()}`;
  }

  return formatted;
}

/**
 * Get currency symbol for a given currency code
 * 
 * @param currency - ISO 4217 currency code
 * @returns Currency symbol
 * 
 * @example
 * getCurrencySymbol('usd') // "$"
 * getCurrencySymbol('eur') // "€"
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  const metadata = CURRENCY_METADATA[currency];
  if (!metadata) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return metadata.symbol;
}

/**
 * Get currency name for a given currency code
 * 
 * @param currency - ISO 4217 currency code
 * @returns Currency name
 * 
 * @example
 * getCurrencyName('usd') // "US Dollar"
 * getCurrencyName('eur') // "Euro"
 */
export function getCurrencyName(currency: SupportedCurrency): string {
  const metadata = CURRENCY_METADATA[currency];
  if (!metadata) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return metadata.name;
}

/**
 * Parse currency string to cents
 * 
 * @param value - Currency string (e.g., "25.00", "$25.00")
 * @param currency - ISO 4217 currency code
 * @returns Amount in cents
 * 
 * @example
 * parseCurrency("25.00", 'usd') // 2500
 * parseCurrency("$25.00", 'usd') // 2500
 */
export function parseCurrency(value: string, currency: SupportedCurrency = 'usd'): number {
  const metadata = CURRENCY_METADATA[currency];
  if (!metadata) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    throw new Error(`Invalid currency value: ${value}`);
  }

  // Convert to cents
  return Math.round(amount * 100);
}

/**
 * Get list of all supported currencies
 * 
 * @returns Array of currency objects with code, symbol, and name
 */
export function getSupportedCurrencies(): Array<{
  code: SupportedCurrency;
  symbol: string;
  name: string;
}> {
  return Object.entries(CURRENCY_METADATA).map(([code, metadata]) => ({
    code: code as SupportedCurrency,
    symbol: metadata.symbol,
    name: metadata.name,
  }));
}
