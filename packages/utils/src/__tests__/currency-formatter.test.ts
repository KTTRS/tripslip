import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyName,
  parseCurrency,
  getSupportedCurrencies,
} from '../currency-formatter';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(2500, 'usd')).toBe('$25.00');
    expect(formatCurrency(100, 'usd')).toBe('$1.00');
    expect(formatCurrency(0, 'usd')).toBe('$0.00');
  });

  it('should format EUR correctly', () => {
    const result = formatCurrency(2500, 'eur');
    expect(result).toContain('25');
    expect(result).toContain('€');
  });

  it('should format GBP correctly', () => {
    const result = formatCurrency(2500, 'gbp');
    expect(result).toContain('25');
    expect(result).toContain('£');
  });

  it('should format JPY correctly (no decimals)', () => {
    const result = formatCurrency(2500, 'jpy');
    expect(result).toContain('25');
    expect(result).toContain('¥');
    expect(result).not.toContain('.00');
  });

  it('should handle large amounts', () => {
    const result = formatCurrency(1000000, 'usd');
    expect(result).toContain('10,000');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-2500, 'usd');
    expect(result).toContain('-');
    expect(result).toContain('25');
  });

  it('should respect showCode option', () => {
    const result = formatCurrency(2500, 'usd', { showCode: true });
    expect(result).toContain('USD');
  });

  it('should respect showSymbol option', () => {
    const result = formatCurrency(2500, 'usd', { showSymbol: false });
    expect(result).not.toContain('$');
    expect(result).toContain('25');
  });

  it('should throw error for unsupported currency', () => {
    expect(() => formatCurrency(2500, 'xxx' as any)).toThrow('Unsupported currency');
  });
});

describe('getCurrencySymbol', () => {
  it('should return correct symbols', () => {
    expect(getCurrencySymbol('usd')).toBe('$');
    expect(getCurrencySymbol('eur')).toBe('€');
    expect(getCurrencySymbol('gbp')).toBe('£');
    expect(getCurrencySymbol('jpy')).toBe('¥');
    expect(getCurrencySymbol('cad')).toBe('CA$');
  });

  it('should throw error for unsupported currency', () => {
    expect(() => getCurrencySymbol('xxx' as any)).toThrow('Unsupported currency');
  });
});

describe('getCurrencyName', () => {
  it('should return correct names', () => {
    expect(getCurrencyName('usd')).toBe('US Dollar');
    expect(getCurrencyName('eur')).toBe('Euro');
    expect(getCurrencyName('gbp')).toBe('British Pound');
    expect(getCurrencyName('jpy')).toBe('Japanese Yen');
  });

  it('should throw error for unsupported currency', () => {
    expect(() => getCurrencyName('xxx' as any)).toThrow('Unsupported currency');
  });
});

describe('parseCurrency', () => {
  it('should parse plain numbers', () => {
    expect(parseCurrency('25.00', 'usd')).toBe(2500);
    expect(parseCurrency('1.00', 'usd')).toBe(100);
    expect(parseCurrency('0.50', 'usd')).toBe(50);
  });

  it('should parse currency strings with symbols', () => {
    expect(parseCurrency('$25.00', 'usd')).toBe(2500);
    expect(parseCurrency('€25.00', 'eur')).toBe(2500);
    expect(parseCurrency('£25.00', 'gbp')).toBe(2500);
  });

  it('should handle strings with commas', () => {
    expect(parseCurrency('1,000.00', 'usd')).toBe(100000);
    expect(parseCurrency('$1,234.56', 'usd')).toBe(123456);
  });

  it('should round to nearest cent', () => {
    expect(parseCurrency('25.005', 'usd')).toBe(2501);
    expect(parseCurrency('25.004', 'usd')).toBe(2500);
  });

  it('should throw error for invalid values', () => {
    expect(() => parseCurrency('invalid', 'usd')).toThrow('Invalid currency value');
    expect(() => parseCurrency('', 'usd')).toThrow('Invalid currency value');
  });

  it('should throw error for unsupported currency', () => {
    expect(() => parseCurrency('25.00', 'xxx' as any)).toThrow('Unsupported currency');
  });
});

describe('getSupportedCurrencies', () => {
  it('should return array of supported currencies', () => {
    const currencies = getSupportedCurrencies();
    expect(Array.isArray(currencies)).toBe(true);
    expect(currencies.length).toBeGreaterThan(0);
  });

  it('should include required properties', () => {
    const currencies = getSupportedCurrencies();
    currencies.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('name');
    });
  });

  it('should include common currencies', () => {
    const currencies = getSupportedCurrencies();
    const codes = currencies.map(c => c.code);
    expect(codes).toContain('usd');
    expect(codes).toContain('eur');
    expect(codes).toContain('gbp');
    expect(codes).toContain('jpy');
  });
});
