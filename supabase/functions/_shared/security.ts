// Security headers for all responses
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com;",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

// Input validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  // Basic international phone validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents > 0 && amountCents <= 100000000 // Max $1M
}

export function validateFileUpload(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size: 10MB' }
  }

  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' }
  }

  return { valid: true }
}

// SQL injection prevention (Supabase handles this, but extra validation)
export function validateSearchQuery(query: string): string {
  // Remove SQL keywords and special characters
  return query
    .replace(/[;'"\\]/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '')
    .trim()
    .slice(0, 100)
}
