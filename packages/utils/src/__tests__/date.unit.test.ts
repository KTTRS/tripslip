/**
 * Unit Tests - Date Utilities
 * 
 * Tests date utility functions including:
 * - Date formatting
 * - Timezone handling
 * - Date calculations
 * - Relative date formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  formatDate, 
  formatDateTime, 
  formatRelativeDate,
  formatRelativeTo,
  formatInTimezone,
  toTimezone,
  nowUTC,
  isPast,
  isFuture,
  addDays,
  daysBetween
} from '../date';

describe('Date Utilities', () => {
  beforeEach(() => {
    // Mock current date to ensure consistent test results
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  describe('formatDate', () => {
    it('formats date in default format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('formats date with custom format string', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('formats date with different language', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, 'PPP', 'es');
      expect(result).toContain('enero'); // Spanish for January
    });

    it('handles ISO string input', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toContain('January');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time in default format', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('January');
      expect(result).toContain('2:30');
    });

    it('formats with custom format string', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date, 'yyyy-MM-dd HH:mm');
      expect(result).toBe('2024-01-15 14:30');
    });

    it('handles different languages', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatDateTime(date, 'PPP p', 'es');
      expect(result).toContain('enero');
    });
  });

  describe('formatRelativeDate', () => {
    it('formats past dates', () => {
      const pastDate = new Date('2024-01-13T10:30:00Z'); // 2 days ago
      const result = formatRelativeDate(pastDate);
      expect(result).toContain('ago');
    });

    it('formats future dates', () => {
      const futureDate = new Date('2024-01-17T10:30:00Z'); // 2 days from now
      const result = formatRelativeDate(futureDate);
      expect(result).toContain('in');
    });

    it('handles ISO string input', () => {
      const result = formatRelativeDate('2024-01-13T10:30:00Z');
      expect(result).toContain('ago');
    });

    it('supports different languages', () => {
      const pastDate = new Date('2024-01-13T10:30:00Z');
      const result = formatRelativeDate(pastDate, 'es');
      expect(result).toContain('hace'); // Spanish for "ago"
    });
  });

  describe('formatRelativeTo', () => {
    it('formats date relative to base date', () => {
      const date = new Date('2024-01-14T10:30:00Z');
      const baseDate = new Date('2024-01-15T10:30:00Z');
      const result = formatRelativeTo(date, baseDate);
      expect(result).toContain('yesterday');
    });

    it('handles future dates', () => {
      const date = new Date('2024-01-16T10:30:00Z');
      const baseDate = new Date('2024-01-15T10:30:00Z');
      const result = formatRelativeTo(date, baseDate);
      expect(result).toContain('tomorrow');
    });
  });

  describe('formatInTimezone', () => {
    it('formats date in specific timezone', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatInTimezone(date, 'America/New_York');
      expect(result).toContain('January');
      expect(result).toContain('9:30'); // EST is UTC-5
    });

    it('handles custom format string', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatInTimezone(date, 'America/New_York', 'HH:mm');
      expect(result).toBe('09:30');
    });
  });

  describe('toTimezone', () => {
    it('converts date to timezone', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = toTimezone(date, 'America/New_York');
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(9); // EST is UTC-5
    });

    it('handles ISO string input', () => {
      const result = toTimezone('2024-01-15T14:30:00Z', 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('nowUTC', () => {
    it('returns current UTC time as ISO string', () => {
      const result = nowUTC();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('returns current time', () => {
      const before = Date.now();
      const result = new Date(nowUTC()).getTime();
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('isPast', () => {
    it('returns true for past dates', () => {
      const pastDate = new Date('2024-01-14T10:30:00Z');
      expect(isPast(pastDate)).toBe(true);
    });

    it('returns false for future dates', () => {
      const futureDate = new Date('2024-01-16T10:30:00Z');
      expect(isPast(futureDate)).toBe(false);
    });

    it('handles ISO string input', () => {
      expect(isPast('2024-01-14T10:30:00Z')).toBe(true);
      expect(isPast('2024-01-16T10:30:00Z')).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      const futureDate = new Date('2024-01-16T10:30:00Z');
      expect(isFuture(futureDate)).toBe(true);
    });

    it('returns false for past dates', () => {
      const pastDate = new Date('2024-01-14T10:30:00Z');
      expect(isFuture(pastDate)).toBe(false);
    });

    it('handles ISO string input', () => {
      expect(isFuture('2024-01-16T10:30:00Z')).toBe(true);
      expect(isFuture('2024-01-14T10:30:00Z')).toBe(false);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-20');
    });

    it('adds negative days (subtracts)', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, -5);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-10');
    });

    it('handles month boundaries', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-02-04');
    });

    it('handles year boundaries', () => {
      const date = new Date('2023-12-30');
      const result = addDays(date, 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-04');
    });

    it('handles ISO string input', () => {
      const result = addDays('2024-01-15', 5);
      expect(result.toISOString().split('T')[0]).toBe('2024-01-20');
    });
  });

  describe('daysBetween', () => {
    it('calculates days between dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      expect(daysBetween(date1, date2)).toBe(5);
    });

    it('handles reversed dates', () => {
      const date1 = new Date('2024-01-20');
      const date2 = new Date('2024-01-15');
      expect(daysBetween(date1, date2)).toBe(5);
    });

    it('handles same date', () => {
      const date = new Date('2024-01-15');
      expect(daysBetween(date, date)).toBe(0);
    });

    it('handles ISO string input', () => {
      const result = daysBetween('2024-01-15', '2024-01-20');
      expect(result).toBe(5);
    });

    it('handles cross-month boundaries', () => {
      const date1 = new Date('2024-01-30');
      const date2 = new Date('2024-02-05');
      expect(daysBetween(date1, date2)).toBe(6);
    });
  });
});