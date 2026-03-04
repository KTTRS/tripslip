/**
 * Authentication and Authorization Error Classes
 * Provides structured error handling for auth operations
 */

/**
 * Base authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AuthError {
  constructor() {
    super(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
      401
    );
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Email already exists error
 */
export class EmailExistsError extends AuthError {
  constructor() {
    super(
      'An account with this email already exists',
      'EMAIL_EXISTS',
      409
    );
    this.name = 'EmailExistsError';
  }
}

/**
 * Email not verified error
 */
export class EmailNotVerifiedError extends AuthError {
  constructor() {
    super(
      'Please verify your email address to continue',
      'EMAIL_NOT_VERIFIED',
      403,
      { canResendVerification: true }
    );
    this.name = 'EmailNotVerifiedError';
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends AuthError {
  constructor() {
    super(
      'Your session has expired. Please log in again.',
      'SESSION_EXPIRED',
      401
    );
    this.name = 'SessionExpiredError';
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AuthError {
  constructor() {
    super(
      'The verification link is invalid or has expired',
      'INVALID_TOKEN',
      400
    );
    this.name = 'InvalidTokenError';
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AuthError {
  constructor(requiredRole?: string, userRole?: string) {
    super(
      'You do not have permission to access this resource',
      'INSUFFICIENT_PERMISSIONS',
      403,
      { requiredRole, userRole }
    );
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Organization access denied error
 */
export class OrganizationAccessDeniedError extends AuthError {
  constructor(organizationType: string, organizationId: string) {
    super(
      'You do not have access to this organization',
      'ORGANIZATION_ACCESS_DENIED',
      403,
      { organizationType, organizationId }
    );
    this.name = 'OrganizationAccessDeniedError';
  }
}

/**
 * No active role error
 */
export class NoActiveRoleError extends AuthError {
  constructor() {
    super(
      'No active role context found. Please select a role.',
      'NO_ACTIVE_ROLE',
      400
    );
    this.name = 'NoActiveRoleError';
  }
}

/**
 * Invalid email format error
 */
export class InvalidEmailError extends AuthError {
  constructor() {
    super(
      'Please provide a valid email address',
      'INVALID_EMAIL',
      400
    );
    this.name = 'InvalidEmailError';
  }
}

/**
 * Weak password error
 */
export class WeakPasswordError extends AuthError {
  constructor() {
    super(
      'Password must be at least 8 characters long',
      'WEAK_PASSWORD',
      400
    );
    this.name = 'WeakPasswordError';
  }
}

/**
 * Invalid organization error
 */
export class InvalidOrganizationError extends AuthError {
  constructor(organizationType: string, organizationId: string) {
    super(
      'The selected organization does not exist',
      'INVALID_ORGANIZATION',
      400,
      { organizationType, organizationId }
    );
    this.name = 'InvalidOrganizationError';
  }
}

/**
 * Helper function to convert Supabase errors to AuthErrors
 */
export function handleSupabaseError(error: any): AuthError {
  // Check for specific Supabase error codes
  if (error.message?.includes('Invalid login credentials')) {
    return new InvalidCredentialsError();
  }
  
  if (error.message?.includes('User already registered')) {
    return new EmailExistsError();
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return new EmailNotVerifiedError();
  }
  
  if (error.message?.includes('JWT expired')) {
    return new SessionExpiredError();
  }
  
  if (error.message?.includes('Invalid token')) {
    return new InvalidTokenError();
  }
  
  // Default to generic auth error
  return new AuthError(
    error.message || 'An authentication error occurred',
    'AUTH_ERROR',
    error.status || 500
  );
}
