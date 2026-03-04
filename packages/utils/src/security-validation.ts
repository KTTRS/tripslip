/**
 * Security Validation Utilities
 * Provides input validation and sanitization for security-critical operations
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * SQL Injection Prevention
 * Validates that input doesn't contain SQL injection patterns
 */
export function validateNoSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*|1=1|'=')/i,
  ];

  return !sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * XSS Prevention
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize user input for display
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * CSRF Token Validation
 * Validates CSRF tokens for state-changing operations
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  if (token.length !== expectedToken.length) return false;
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Path Traversal Prevention
 * Validates that file paths don't contain directory traversal attempts
 */
export function validateSafePath(path: string): boolean {
  const dangerousPatterns = [
    /\.\./,  // Parent directory
    /~\//,   // Home directory
    /^\//, // Absolute path
    /\\/,    // Windows path separator
  ];

  return !dangerousPatterns.some(pattern => pattern.test(path));
}

/**
 * Magic Link Token Validation
 * Validates magic link tokens for security
 */
export function validateMagicLinkToken(token: string): boolean {
  // Must be alphanumeric, 32-64 characters
  const tokenPattern = /^[a-zA-Z0-9]{32,64}$/;
  return tokenPattern.test(token);
}

/**
 * Rate Limiting Key Generation
 * Generates consistent keys for rate limiting
 */
export function generateRateLimitKey(
  identifier: string,
  action: string
): string {
  return `ratelimit:${action}:${identifier}`;
}

/**
 * Secure Random String Generation
 * Generates cryptographically secure random strings
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Password Strength Validation
 * Validates password meets security requirements
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score++;
  }

  // Complexity checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Common patterns
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    feedback.push('Password is too common');
    score = Math.max(0, score - 2);
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  const isValid = password.length >= 8 && score >= 2;

  if (!isValid && feedback.length === 0) {
    feedback.push('Password must contain a mix of letters, numbers, and symbols');
  }

  return { isValid, score, feedback };
}

/**
 * Email Validation (Security-focused)
 * Validates email addresses with security considerations
 */
export function validateSecureEmail(email: string): boolean {
  // Basic format check
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) return false;

  // Length limits
  if (email.length > 254) return false;

  // Local part length
  const [localPart] = email.split('@');
  if (localPart.length > 64) return false;

  // No dangerous characters
  const dangerousChars = ['<', '>', '"', '\\', ',', ';', ':'];
  if (dangerousChars.some(char => email.includes(char))) return false;

  return true;
}

/**
 * Phone Number Validation (Security-focused)
 * Validates phone numbers with security considerations
 */
export function validateSecurePhone(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Must be digits only (with optional + prefix)
  const phonePattern = /^\+?[0-9]{10,15}$/;
  if (!phonePattern.test(cleaned)) return false;

  // No suspicious patterns
  if (/^0+$/.test(cleaned)) return false; // All zeros
  if (/^1+$/.test(cleaned)) return false; // All ones

  return true;
}

/**
 * URL Validation (Security-focused)
 * Validates URLs with security considerations
 */
export function validateSecureURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS (except localhost for development)
    if (parsed.protocol !== 'https:' && !parsed.hostname.includes('localhost')) {
      return false;
    }

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];
    if (dangerousProtocols.some(proto => url.toLowerCase().startsWith(proto))) {
      return false;
    }

    // Block suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTLDs.some(tld => parsed.hostname.endsWith(tld))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Content Security Policy Header Generation
 * Generates CSP headers for the application
 */
export function generateCSPHeader(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

/**
 * Security Headers
 * Returns recommended security headers for HTTP responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': generateCSPHeader(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * Input Length Validation
 * Prevents buffer overflow and DoS attacks
 */
export function validateInputLength(
  input: string,
  maxLength: number,
  fieldName: string = 'Input'
): { valid: boolean; error?: string } {
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
    };
  }
  return { valid: true };
}

/**
 * Validate JSON Input
 * Safely validates and parses JSON input
 */
export function validateJSONInput(
  input: string,
  maxSize: number = 1024 * 100 // 100KB default
): { valid: boolean; data?: any; error?: string } {
  // Size check
  if (input.length > maxSize) {
    return {
      valid: false,
      error: `JSON input exceeds maximum size of ${maxSize} bytes`,
    };
  }

  try {
    const data = JSON.parse(input);
    return { valid: true, data };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON format',
    };
  }
}

/**
 * Sanitize File Name
 * Removes dangerous characters from file names
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/\.\./g, '')
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Validate File Upload
 * Validates file uploads for security
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  } = options;

  // Size check
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Type check
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Extension check
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  // File name validation
  if (!validateSafePath(file.name)) {
    return {
      valid: false,
      error: 'File name contains invalid characters',
    };
  }

  return { valid: true };
}
