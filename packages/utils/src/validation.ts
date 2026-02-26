import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address
 * @param email - Email address to validate
 * @returns True if valid email format
 * 
 * @example
 * ```ts
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone number
 * @param phone - Phone number to validate
 * @param country - Country code (default: 'US')
 * @returns True if valid phone number
 * 
 * @example
 * ```ts
 * isValidPhone('+1 (555) 123-4567', 'US') // true
 * isValidPhone('555-1234', 'US') // false (incomplete)
 * ```
 */
export function isValidPhone(phone: string, country: string = 'US'): boolean {
  if (!phone || typeof phone !== 'string') return false;
  try {
    return isValidPhoneNumber(phone, country as any);
  } catch {
    return false;
  }
}

/**
 * Format phone number for display
 * @param phone - Phone number to format
 * @param country - Country code (default: 'US')
 * @returns Formatted phone number or original if invalid
 * 
 * @example
 * ```ts
 * formatPhone('+15551234567', 'US') // '+1 (555) 123-4567'
 * ```
 */
export function formatPhone(phone: string, country: string = 'US'): string {
  if (!phone) return '';
  try {
    const phoneNumber = parsePhoneNumber(phone, country as any);
    return phoneNumber.formatInternational();
  } catch {
    return phone;
  }
}

/**
 * Validate URL
 * @param url - URL to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required field
 * @param value - Value to validate
 * @returns True if value is not empty
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate minimum length
 * @param value - String to validate
 * @param minLength - Minimum length
 * @returns True if value meets minimum length
 */
export function minLength(value: string, minLength: number): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 * @param value - String to validate
 * @param maxLength - Maximum length
 * @returns True if value is within maximum length
 */
export function maxLength(value: string, maxLength: number): boolean {
  if (!value || typeof value !== 'string') return true;
  return value.trim().length <= maxLength;
}

/**
 * Validate number range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if value is within range
 */
export function inRange(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 * 
 * @example
 * ```ts
 * isValidFileType(file, ['image/jpeg', 'image/png'])
 * ```
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeBytes - Maximum size in bytes
 * @returns True if file size is within limit
 * 
 * @example
 * ```ts
 * isValidFileSize(file, 5 * 1024 * 1024) // 5MB limit
 * ```
 */
export function isValidFileSize(file: File, maxSizeBytes: number): boolean {
  if (!file || !file.size) return false;
  return file.size <= maxSizeBytes;
}

/**
 * Sanitize HTML string (basic XSS prevention)
 * @param html - HTML string to sanitize
 * @returns Sanitized string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate credit card number (Luhn algorithm)
 * Note: Use Stripe for actual payment processing
 * @param cardNumber - Card number to validate
 * @returns True if valid card number format
 */
export function isValidCardNumber(cardNumber: string): boolean {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if only digits
  if (!/^\d+$/.test(cleaned)) return false;
  
  // Check length (13-19 digits)
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Create validation result
 * @param errors - Array of validation errors
 * @returns Validation result object
 */
export function createValidationResult(errors: ValidationError[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}
