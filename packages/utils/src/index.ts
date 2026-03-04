// Date utilities
export {
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
  daysBetween,
} from './date';

// Validation utilities
export {
  sanitizeInput,
  validateEmail,
  validatePhone,
  preventSQLInjection,
  validateFileType,
  ALLOWED_FILE_TYPES,
  DANGEROUS_FILE_TYPES,
} from './validation';

// Error handling
export {
  TripSlipError,
  AuthenticationError,
  AuthorizationError,
  ValidationError as ValidationErrorClass,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  NetworkError,
  isTripSlipError,
  getUserFriendlyMessage,
  withErrorHandling,
  logError,
} from './errors';

// Error handling utilities (Result pattern)
export {
  withAsyncErrorHandling,
  withSyncErrorHandling,
  withRetry,
} from './error-handling';
export type { Result } from './error-handling';

// Environment validation
export {
  validateEnv,
  LANDING_APP_ENV,
  VENUE_APP_ENV,
  SCHOOL_APP_ENV,
  TEACHER_APP_ENV,
  PARENT_APP_ENV,
} from './env-validation';
export type { EnvConfig } from './env-validation';

// Logging
export { Logger, logger } from './logger';

// Monitoring
export {
  initMonitoring,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
} from './monitoring';
export type { MonitoringConfig } from './monitoring';

// PDF Generation
export {
  generateReceipt,
  downloadReceipt,
} from './pdf-generator';
export type { ReceiptData } from './pdf-generator';

// Currency formatting
export {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyName,
  parseCurrency,
  getSupportedCurrencies,
} from './currency-formatter';
export type { SupportedCurrency, CurrencyFormatOptions } from './currency-formatter';

// Sanitization
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeUserInput,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeObject,
  SANITIZATION_PRESETS,
} from './sanitization';
export type { SanitizationOptions } from './sanitization';

// Phone validation
export {
  validatePhoneNumber,
  formatPhoneNumber,
  formatPhoneNumberNational,
  formatPhoneNumberE164,
  getPhoneCountryCode,
  getPhoneNumberType,
  isMobileNumber,
  parsePhone,
  COMMON_COUNTRY_CODES,
} from './phone-validation';

// File validation
export {
  validateFileSize,
  validateFileMimeType,
  validateFileExtension,
  validateExtensionMimeTypeMatch,
  validateFileMagicBytes,
  validateFile,
  validateFiles,
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
  FILE_TYPE_PRESETS,
} from './file-validation';
export type { FileValidationResult, FileValidationOptions } from './file-validation';

// Retry logic
export {
  calculateDelay,
  sleep,
  retryWithBackoff,
  createRetryWrapper,
  DEFAULT_RETRY_OPTIONS,
  EMAIL_RETRY_OPTIONS,
  SMS_RETRY_OPTIONS,
  API_RETRY_OPTIONS,
} from './retry-logic';
export type { RetryOptions, RetryResult } from './retry-logic';

// Security validation
export {
  validateNoSQLInjection,
  sanitizeHTML,
  sanitizeUserInput as sanitizeSecureInput,
  generateCSRFToken,
  validateCSRFToken,
  validateSafePath,
  validateMagicLinkToken,
  generateRateLimitKey,
  generateSecureToken,
  validatePasswordStrength,
  validateSecureEmail,
  validateSecurePhone,
  validateSecureURL,
  generateCSPHeader,
  getSecurityHeaders,
  validateInputLength,
  validateJSONInput,
  sanitizeFileName,
  validateFileUpload,
} from './security-validation';
export type { PasswordStrength, FileValidationResult as SecureFileValidationResult } from './security-validation';

// FERPA data export
export {
  generateStudentDataExport,
  generateStudentDataCSV,
  generateStudentDataJSON,
  shouldRetainStudentData,
  getStudentsEligibleForPurge,
  anonymizeStudentData,
  isConsentValid,
  logFERPADisclosure,
} from './ferpa-data-export';
export type {
  StudentDataExport,
  ParentalConsent,
  FERPADisclosure,
} from './ferpa-data-export';

// Twilio client (Replit integration)
export { getTwilioClient, getTwilioFromPhoneNumber } from './twilio-client';

// Accessibility testing
export {
  checkColorContrast,
  validateARIAAttributes,
  checkKeyboardAccessibility,
  validateHeadingStructure,
  validateFormAccessibility,
  validateImageAccessibility,
  validateLinkAccessibility,
  validateTouchTargetSize,
  hasFocusIndicator,
} from './accessibility-testing';
export type {
  ContrastResult,
  ARIAValidationResult,
  KeyboardAccessibilityResult,
  HeadingStructureResult,
  FormAccessibilityResult,
  ImageAccessibilityResult,
  LinkAccessibilityResult,
  TouchTargetResult,
} from './accessibility-testing';
