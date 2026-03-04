import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyName,
  parseCurrency,
  getSupportedCurrencies,
  SupportedCurrency,
} from '../currency-formatter';

describe('currency-formatter utilities', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(2500, 'usd')).toBe('$25.00');
      expect(formatCurrency(0, 'usd')).toBe('$0.00');
      expect(formatCurrency(1, 'usd')).toBe('$0.01');
      expect(formatCurrency(999, 'usd')).toBe('$9.99');
    });

    it('formats EUR currency correctly', () => {
      expect(formatCurrency(2500, 'eur')).toBe('€25.00');
      expect(formatCurrency(12345, 'eur')).toBe('€123.45');
    });

    it('formats GBP currency correctly', () => {
      expect(formatCurrency(2500, 'gbp')).toBe('£25.00');
      expect(formatCurrency(50000, 'gbp')).toBe('£500.00');
    });

    it('formats JPY currency correctly (no decimals)', () => {
      expect(formatCurrency(2500, 'jpy')).toBe('¥25');
      expect(formatCurrency(12345, 'jpy')).toBe('¥123');
    });

    it('handles large amounts', () => {
      expect(formatCurrency(123456789, 'usd')).toBe('$1,234,567.89');
      expect(formatCurrency(1000000, 'usd')).toBe('$10,000.00');
    });

    it('handles negative amounts', () => {
      expect(formatCurrency(-2500, 'usd')).toBe('-$25.00');
      expect(formatCurrency(-12345, 'eur')).toBe('-€123.45');
    });

    it('respects locale formatting', () => {
      // German locale uses comma for decimal separator
      expect(formatCurrency(2500, 'eur', { locale: 'de-DE' })).toMatch(/25[,.]00/);
      
      // French locale
      expect(formatCurrency(2500, 'eur', { locale: 'fr-FR' })).toMatch(/25[,.]00/);
    });

    it('supports showSymbol option', () => {
      expect(formatCurrency(2500, 'usd', { showSymbol: false })).toBe('25.00');
      expect(formatCurrency(2500, 'eur', { showSymbol: false })).toBe('25.00');
    });

    it('supports showCode option', () => {
      const result = formatCurrency(2500, 'usd', { showCode: true });
      expect(result).toContain('USD');
      expect(result).toContain('$25.00');
    });

    it('combines showSymbol and showCode options', () => {
      const result = formatCurrency(2500, 'usd', { 
        showSymbol: false, 
        showCode: true 
      });
      expect(result).toContain('25.00');
      expect(result).toContain('USD');
      expect(result).not.toContain('$');
    });

    it('throws error for unsupported currency', () => {
      expect(() => formatCurrency(2500, 'xyz' as SupportedCurrency)).toThrow(
        'Unsupported currency: xyz'
      );
    });

    it('handles zero amounts', () => {
      expect(formatCurrency(0, 'usd')).toBe('$0.00');
      expect(formatCurrency(0, 'jpy')).toBe('¥0');
    });

    it('formats all supported currencies', () => {
      const currencies: SupportedCurrency[] = [
        'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'cny', 'inr', 'mxn', 'brl'
      ];

      currencies.forEach(currency => {
        expect(() => formatCurrency(2500, currency)).not.toThrow();
        const result = formatCurrency(2500, currency);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCurrencySymbol', () => {
    it('returns correct symbols for supported currencies', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
      expect(getCurrencySymbol('eur')).toBe('€');
      expect(getCurrencySymbol('gbp')).toBe('£');
      expect(getCurrencySymbol('jpy')).toBe('¥');
      expect(getCurrencySymbol('cad')).toBe('CA$');
      expect(getCurrencySymbol('aud')).toBe('A$');
      expect(getCurrencySymbol('inr')).toBe('₹');
      expect(getCurrencySymbol('mxn')).toBe('MX$');
      expect(getCurrencySymbol('brl')).toBe('R$');
    });

    it('throws error for unsupported currency', () => {
      expect(() => getCurrencySymbol('xyz' as SupportedCurrency)).toThrow(
        'Unsupported currency: xyz'
      );
    });
  });

  describe('getCurrencyName', () => {
    it('returns correct names for supported currencies', () => {
      expect(getCurrencyName('usd')).toBe('US Dollar');
      expect(getCurrencyName('eur')).toBe('Euro');
      expect(getCurrencyName('gbp')).toBe('British Pound');
      expect(getCurrencyName('jpy')).toBe('Japanese Yen');
      expect(getCurrencyName('cad')).toBe('Canadian Dollar');
      expect(getCurrencyName('aud')).toBe('Australian Dollar');
      expect(getCurrencyName('cny')).toBe('Chinese Yuan');
      expect(getCurrencyName('inr')).toBe('Indian Rupee');
      expect(getCurrencyName('mxn')).toBe('Mexican Peso');
      expect(getCurrencyName('brl')).toBe('Brazilian Real');
    });

    it('throws error for unsupported currency', () => {
      expect(() => getCurrencyName('xyz' as SupportedCurrency)).toThrow(
        'Unsupported currency: xyz'
      );
    });
  });

  describe('parseCurrency', () => {
    it('parses USD currency strings correctly', () => {
      expect(parseCurrency('25.00', 'usd')).toBe(2500);
      expect(parseCurrency('$25.00', 'usd')).toBe(2500);
      expect(parseCurrency('0.01', 'usd')).toBe(1);
      expect(parseCurrency('9.99', 'usd')).toBe(999);
    });

    it('parses currency strings with symbols', () => {
      expect(parseCurrency('$25.00', 'usd')).toBe(2500);
      expect(parseCurrency('€25.00', 'eur')).toBe(2500);
      expect(parseCurrency('£25.00', 'gbp')).toBe(2500);
    });

    it('handles currency strings with commas', () => {
      expect(parseCurrency('$1,234.56', 'usd')).toBe(123456);
      expect(parseCurrency('1,000.00', 'usd')).toBe(100000);
    });

    it('handles strings with extra characters', () => {
      expect(parseCurrency('USD $25.00', 'usd')).toBe(2500);
      expect(parseCurrency('Price: $25.00', 'usd')).toBe(2500);
    });

    it('handles zero values', () => {
      expect(parseCurrency('0.00', 'usd')).toBe(0);
      expect(parseCurrency('$0.00', 'usd')).toBe(0);
    });

    it('handles decimal precision correctly', () => {
      expect(parseCurrency('25.123', 'usd')).toBe(2512); // Rounds to nearest cent
      expect(parseCurrency('25.126', 'usd')).toBe(2513); // Rounds up
      expect(parseCurrency('25.124', 'usd')).toBe(2512); // Rounds down
    });

    it('throws error for invalid currency strings', () => {
      expect(() => parseCurrency('invalid', 'usd')).toThrow('Invalid currency value: invalid');
      expect(() => parseCurrency('', 'usd')).toThrow('Invalid currency value: ');
      expect(() => parseCurrency('abc', 'usd')).toThrow('Invalid currency value: abc');
    });

    it('throws error for unsupported currency', () => {
      expect(() => parseCurrency('25.00', 'xyz' as SupportedCurrency)).toThrow(
        'Unsupported currency: xyz'
      );
    });

    it('defaults to USD when currency not specified', () => {
      expect(parseCurrency('25.00')).toBe(2500);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('returns array of supported currencies', () => {
      const currencies = getSupportedCurrencies();
      
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('includes all expected currencies', () => {
      const currencies = getSupportedCurrencies();
      const codes = currencies.map(c => c.code);
      
      expect(codes).toContain('usd');
      expect(codes).toContain('eur');
      expect(codes).toContain('gbp');
      expect(codes).toContain('jpy');
      expect(codes).toContain('cad');
      expect(codes).toContain('aud');
      expect(codes).toContain('cny');
      expect(codes).toContain('inr');
      expect(codes).toContain('mxn');
      expect(codes).toContain('brl');
    });

    it('returns objects with correct structure', () => {
      const currencies = getSupportedCurrencies();
      
      currencies.forEach(currency => {
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('name');
        
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.symbol).toBe('string');
        expect(typeof currency.name).toBe('string');
        
        expect(currency.code.length).toBeGreaterThan(0);
        expect(currency.symbol.length).toBeGreaterThan(0);
        expect(currency.name.length).toBeGreaterThan(0);
      });
    });

    it('returns consistent data with other functions', () => {
      const currencies = getSupportedCurrencies();
      
      currencies.forEach(currency => {
        expect(getCurrencySymbol(currency.code)).toBe(currency.symbol);
        expect(getCurrencyName(currency.code)).toBe(currency.name);
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('handles very large amounts', () => {
      const largeAmount = Number.MAX_SAFE_INTEGER;
      expect(() => formatCurrency(largeAmount, 'usd')).not.toThrow();
    });

    it('handles very small amounts', () => {
      expect(formatCurrency(1, 'usd')).toBe('$0.01');
      expect(formatCurrency(-1, 'usd')).toBe('-$0.01');
    });

    it('handles floating point precision issues', () => {
      // Test common floating point precision issues
      expect(parseCurrency('0.1', 'usd')).toBe(10);
      expect(parseCurrency('0.2', 'usd')).toBe(20);
      expect(parseCurrency('0.3', 'usd')).toBe(30);
    });
  });
});