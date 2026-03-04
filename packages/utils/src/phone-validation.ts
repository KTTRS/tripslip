/**
 * Phone Validation Utility
 * 
 * Provides functions for validating and formatting phone numbers using libphonenumber-js.
 * Supports international phone numbers with country codes.
 */

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Validate phone number
 * 
 * @param phoneNumber - Phone number to validate
 * @param defaultCountry - Default country code (e.g., 'US', 'GB')
 * @returns True if valid phone number
 * 
 * @example
 * validatePhoneNumber('+1 (555) 123-4567', 'US') // true
 * validatePhoneNumber('555-123-4567', 'US') // true
 * validatePhoneNumber('invalid', 'US') // false
 */
export function validatePhoneNumber(phoneNumber: string, defaultCountry: CountryCode = 'US'): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  try {
    return isValidPhoneNumber(phoneNumber, defaultCountry);
  } catch {
    return false;
  }
}

/**
 * Format phone number to international format
 * 
 * @param phoneNumber - Phone number to format
 * @param defaultCountry - Default country code
 * @returns Formatted phone number or original if invalid
 * 
 * @example
 * formatPhoneNumber('+1 (555) 123-4567', 'US') // '+1 555 123 4567'
 * formatPhoneNumber('555-123-4567', 'US') // '+1 555 123 4567'
 */
export function formatPhoneNumber(phoneNumber: string, defaultCountry: CountryCode = 'US'): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return phoneNumber;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed ? parsed.formatInternational() : phoneNumber;
  } catch {
    return phoneNumber;
  }
}

/**
 * Format phone number to national format
 * 
 * @param phoneNumber - Phone number to format
 * @param defaultCountry - Default country code
 * @returns Formatted phone number in national format
 * 
 * @example
 * formatPhoneNumberNational('+1 (555) 123-4567', 'US') // '(555) 123-4567'
 * formatPhoneNumberNational('555-123-4567', 'US') // '(555) 123-4567'
 */
export function formatPhoneNumberNational(phoneNumber: string, defaultCountry: CountryCode = 'US'): string {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return phoneNumber;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed ? parsed.formatNational() : phoneNumber;
  } catch {
    return phoneNumber;
  }
}

/**
 * Format phone number to E.164 format (for storage/API)
 * 
 * @param phoneNumber - Phone number to format
 * @param defaultCountry - Default country code
 * @returns Phone number in E.164 format (+15551234567) or null if invalid
 * 
 * @example
 * formatPhoneNumberE164('+1 (555) 123-4567', 'US') // '+15551234567'
 * formatPhoneNumberE164('555-123-4567', 'US') // '+15551234567'
 */
export function formatPhoneNumberE164(phoneNumber: string, defaultCountry: CountryCode = 'US'): string | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed && parsed.isValid() ? parsed.number : null;
  } catch {
    return null;
  }
}

/**
 * Get country code from phone number
 * 
 * @param phoneNumber - Phone number to parse
 * @param defaultCountry - Default country code
 * @returns Country code or null if cannot be determined
 * 
 * @example
 * getPhoneCountryCode('+1 (555) 123-4567') // 'US'
 * getPhoneCountryCode('+44 20 7946 0958') // 'GB'
 */
export function getPhoneCountryCode(phoneNumber: string, defaultCountry?: CountryCode): CountryCode | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed ? (parsed.country || null) : null;
  } catch {
    return null;
  }
}

/**
 * Get phone number type (mobile, fixed-line, etc.)
 * 
 * @param phoneNumber - Phone number to check
 * @param defaultCountry - Default country code
 * @returns Phone number type or null
 * 
 * @example
 * getPhoneNumberType('+1 (555) 123-4567', 'US') // 'FIXED_LINE_OR_MOBILE'
 */
export function getPhoneNumberType(phoneNumber: string, defaultCountry: CountryCode = 'US'): string | null {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    return parsed ? (parsed.getType() || null) : null;
  } catch {
    return null;
  }
}

/**
 * Check if phone number is mobile
 * 
 * @param phoneNumber - Phone number to check
 * @param defaultCountry - Default country code
 * @returns True if mobile number
 * 
 * @example
 * isMobileNumber('+1 (555) 123-4567', 'US') // depends on number
 */
export function isMobileNumber(phoneNumber: string, defaultCountry: CountryCode = 'US'): boolean {
  const type = getPhoneNumberType(phoneNumber, defaultCountry);
  return type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';
}

/**
 * Parse phone number into components
 * 
 * @param phoneNumber - Phone number to parse
 * @param defaultCountry - Default country code
 * @returns Parsed phone number components or null
 * 
 * @example
 * parsePhone('+1 (555) 123-4567', 'US')
 * // { country: 'US', nationalNumber: '5551234567', countryCallingCode: '1', ... }
 */
export function parsePhone(phoneNumber: string, defaultCountry?: CountryCode) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    if (!parsed) return null;

    return {
      country: parsed.country || null,
      nationalNumber: parsed.nationalNumber,
      countryCallingCode: parsed.countryCallingCode,
      number: parsed.number,
      isValid: parsed.isValid(),
      isPossible: parsed.isPossible(),
      type: parsed.getType() || null,
      uri: parsed.getURI(),
    };
  } catch {
    return null;
  }
}

/**
 * Common country codes for phone validation
 */
export const COMMON_COUNTRY_CODES: CountryCode[] = [
  'US', // United States
  'CA', // Canada
  'GB', // United Kingdom
  'AU', // Australia
  'NZ', // New Zealand
  'IE', // Ireland
  'MX', // Mexico
  'ES', // Spain
  'FR', // France
  'DE', // Germany
  'IT', // Italy
  'BR', // Brazil
  'AR', // Argentina
  'IN', // India
  'CN', // China
  'JP', // Japan
  'KR', // South Korea
];
