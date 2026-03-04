/**
 * Input Sanitization Utility
 * 
 * Provides functions for sanitizing user input to prevent XSS attacks.
 * Uses DOMPurify for robust HTML sanitization.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitization options for different contexts
 */
export interface SanitizationOptions {
  /**
   * Allow specific HTML tags
   */
  allowedTags?: string[];
  
  /**
   * Allow specific HTML attributes
   */
  allowedAttributes?: string[];
  
  /**
   * Allow data attributes (data-*)
   */
  allowDataAttributes?: boolean;
  
  /**
   * Return sanitized string or null if empty
   */
  returnNullIfEmpty?: boolean;
}

/**
 * Preset sanitization configurations
 */
export const SANITIZATION_PRESETS = {
  /**
   * Strict: No HTML allowed, plain text only
   */
  STRICT: {
    allowedTags: [],
    allowedAttributes: [],
    allowDataAttributes: false,
  },
  
  /**
   * Basic: Allow basic formatting tags only
   */
  BASIC: {
    allowedTags: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    allowedAttributes: [],
    allowDataAttributes: false,
  },
  
  /**
   * Rich: Allow common rich text tags
   */
  RICH: {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'code', 'pre'
    ],
    allowedAttributes: ['href', 'src', 'alt', 'title', 'class'],
    allowDataAttributes: false,
  },
  
  /**
   * Full: Allow most HTML tags (for trusted content)
   */
  FULL: {
    allowedTags: undefined, // Allow all safe tags
    allowedAttributes: undefined, // Allow all safe attributes
    allowDataAttributes: true,
  },
} as const;

/**
 * Sanitize HTML string to prevent XSS attacks
 * 
 * @param dirty - Untrusted HTML string
 * @param options - Sanitization options or preset name
 * @returns Sanitized HTML string
 * 
 * @example
 * sanitizeHtml('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeHtml('<b>Bold</b> text', 'BASIC') // '<b>Bold</b> text'
 * sanitizeHtml('<a href="javascript:alert()">Click</a>') // '<a>Click</a>'
 */
export function sanitizeHtml(
  dirty: string,
  options: SanitizationOptions | keyof typeof SANITIZATION_PRESETS = 'STRICT'
): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // Get options from preset or use provided options
  const sanitizationOptions = typeof options === 'string'
    ? SANITIZATION_PRESETS[options]
    : options;

  // Configure DOMPurify
  const config: any = {
    ALLOWED_TAGS: sanitizationOptions.allowedTags,
    ALLOWED_ATTR: sanitizationOptions.allowedAttributes,
    ALLOW_DATA_ATTR: sanitizationOptions.allowDataAttributes || false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  };

  // Sanitize the HTML
  const clean = DOMPurify.sanitize(dirty, config);

  // Return null if empty and option is set
  if ('returnNullIfEmpty' in sanitizationOptions && sanitizationOptions.returnNullIfEmpty && !clean.toString().trim()) {
    return '';
  }

  return clean.toString();
}

/**
 * Sanitize plain text (strip all HTML)
 * 
 * @param text - Untrusted text that may contain HTML
 * @returns Plain text with all HTML removed
 * 
 * @example
 * sanitizeText('<b>Hello</b> World') // 'Hello World'
 * sanitizeText('<script>alert("xss")</script>') // ''
 */
export function sanitizeText(text: string): string {
  return sanitizeHtml(text, 'STRICT');
}

/**
 * Sanitize user input for display (allows basic formatting)
 * 
 * @param input - User input that may contain basic HTML
 * @returns Sanitized HTML with basic formatting preserved
 * 
 * @example
 * sanitizeUserInput('<b>Bold</b> and <script>alert()</script>') // '<b>Bold</b> and '
 */
export function sanitizeUserInput(input: string): string {
  return sanitizeHtml(input, 'BASIC');
}

/**
 * Sanitize rich text content (allows more HTML tags)
 * 
 * @param content - Rich text content from editor
 * @returns Sanitized HTML with rich formatting preserved
 * 
 * @example
 * sanitizeRichText('<h1>Title</h1><p>Content</p>') // '<h1>Title</h1><p>Content</p>'
 */
export function sanitizeRichText(content: string): string {
  return sanitizeHtml(content, 'RICH');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 * 
 * @example
 * sanitizeUrl('https://example.com') // 'https://example.com'
 * sanitizeUrl('javascript:alert()') // ''
 * sanitizeUrl('data:text/html,<script>alert()</script>') // ''
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Allow http, https, mailto, tel, and relative URLs
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:', '//', '/'];
  const hasAllowedProtocol = allowedProtocols.some(protocol => trimmed.startsWith(protocol));
  
  // If no protocol, assume relative URL (allowed)
  if (!trimmed.includes(':') || hasAllowedProtocol) {
    return url.trim();
  }

  // Unknown protocol, block it
  return '';
}

/**
 * Sanitize filename to prevent path traversal
 * 
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 * 
 * @example
 * sanitizeFilename('document.pdf') // 'document.pdf'
 * sanitizeFilename('../../../etc/passwd') // 'passwd'
 * sanitizeFilename('file<script>.txt') // 'filescript.txt'
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove path separators and parent directory references
  let sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[<>:"|?*]/g, '');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized || 'file';
}

/**
 * Sanitize object by sanitizing all string values
 * 
 * @param obj - Object with potentially unsafe string values
 * @param options - Sanitization options
 * @returns Object with sanitized string values
 * 
 * @example
 * sanitizeObject({ name: '<b>John</b>', age: 30 }) // { name: 'John', age: 30 }
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions | keyof typeof SANITIZATION_PRESETS = 'STRICT'
): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value, options);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeHtml(item, options) :
        item && typeof item === 'object' ? sanitizeObject(item, options) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
