import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { enUS, es, arSA } from 'date-fns/locale';

/**
 * Locale map for date-fns
 */
const localeMap = {
  en: enUS,
  es: es,
  ar: arSA,
};

/**
 * Get date-fns locale for language code
 */
function getLocale(language: string = 'en') {
  return localeMap[language as keyof typeof localeMap] || enUS;
}

/**
 * Format a date string or Date object
 * @param date - Date string (ISO) or Date object
 * @param formatStr - Format string (default: 'PPP' = 'April 29, 2023')
 * @param language - Language code (en, es, ar)
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate('2023-04-29', 'PPP', 'en') // 'April 29, 2023'
 * formatDate('2023-04-29', 'PPP', 'es') // '29 de abril de 2023'
 * ```
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'PPP',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: getLocale(language) });
}

/**
 * Format a date and time string
 * @param date - Date string (ISO) or Date object
 * @param formatStr - Format string (default: 'PPP p' = 'April 29, 2023 at 2:30 PM')
 * @param language - Language code
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: string | Date,
  formatStr: string = 'PPP p',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: getLocale(language) });
}

/**
 * Format a date relative to now
 * @param date - Date string (ISO) or Date object
 * @param language - Language code
 * @returns Relative date string (e.g., '2 days ago', 'in 3 hours')
 * 
 * @example
 * ```ts
 * formatRelativeDate('2023-04-27') // '2 days ago'
 * formatRelativeDate('2023-05-01') // 'in 2 days'
 * ```
 */
export function formatRelativeDate(
  date: string | Date,
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: getLocale(language),
  });
}

/**
 * Format a date relative to a base date
 * @param date - Date string (ISO) or Date object
 * @param baseDate - Base date for comparison
 * @param language - Language code
 * @returns Relative date string (e.g., 'yesterday', 'tomorrow')
 */
export function formatRelativeTo(
  date: string | Date,
  baseDate: Date,
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, baseDate, { locale: getLocale(language) });
}

/**
 * Format a date in a specific timezone
 * @param date - Date string (ISO) or Date object
 * @param timezone - IANA timezone (e.g., 'America/New_York')
 * @param formatStr - Format string
 * @param language - Language code
 * @returns Formatted date string in timezone
 * 
 * @example
 * ```ts
 * formatInTimezone('2023-04-29T14:30:00Z', 'America/New_York', 'PPP p')
 * // 'April 29, 2023 at 10:30 AM'
 * ```
 */
export function formatInTimezone(
  date: string | Date,
  timezone: string,
  formatStr: string = 'PPP p',
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr, {
    locale: getLocale(language),
  });
}

/**
 * Convert a date to a specific timezone
 * @param date - Date string (ISO) or Date object
 * @param timezone - IANA timezone
 * @returns Date object in timezone
 */
export function toTimezone(date: string | Date, timezone: string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, timezone);
}

/**
 * Get current date in UTC
 * @returns ISO string in UTC
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Check if a date is in the past
 * @param date - Date string (ISO) or Date object
 * @returns True if date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < new Date();
}

/**
 * Check if a date is in the future
 * @param date - Date string (ISO) or Date object
 * @returns True if date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > new Date();
}

/**
 * Add days to a date
 * @param date - Date string (ISO) or Date object
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
