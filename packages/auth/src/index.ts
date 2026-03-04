// Authentication service
export { createAuthService, SupabaseAuthService } from './service';
export type { AuthService } from './service';

// RBAC service
export type { RBACAuthService } from './rbac-service';
export { createRBACAuthService, SupabaseRBACAuthService } from './rbac-service-impl';

// Audit service
export type { AuditService, AuditAction, AuditLogEntry } from './audit-service';
export { createAuditService, SupabaseAuditService } from './audit-service';

// Role assignment validator
export type {
  RoleAssignmentValidator,
  RoleAssignmentValidationError,
  RoleAssignmentValidationResult,
} from './role-assignment-validator';
export {
  createRoleAssignmentValidator,
  SupabaseRoleAssignmentValidator,
} from './role-assignment-validator';

// Session management
export { sessionStorage, tempSessionStorage } from './session';

// Token utilities
export {
  generateSecureToken,
  generateMagicLinkToken,
  generateDirectLinkToken,
  isValidTokenFormat,
  isTokenExpired,
  magicLinkRateLimiter,
  directLinkRateLimiter,
} from './tokens';

// RBAC types
export type {
  UserRole,
  OrganizationType,
  RoleAssignment,
  ActiveRoleContext,
  SignUpParams,
  SignUpResult,
  SignInResult,
  JWTClaims,
  Organization,
  UserRoleDefinition,
} from './types';

// Context types
export type { AuthContextType } from './context-types';

// Error classes
export {
  AuthError,
  InvalidCredentialsError,
  EmailExistsError,
  EmailNotVerifiedError,
  SessionExpiredError,
  InvalidTokenError,
  InsufficientPermissionsError,
  OrganizationAccessDeniedError,
  NoActiveRoleError,
  InvalidEmailError,
  WeakPasswordError,
  InvalidOrganizationError,
  handleSupabaseError,
} from './errors';

// Validation utilities
export {
  validateEmail,
  validatePassword,
  validateOrganization,
  validateSignupParams,
} from './validation';

// React context and hooks
export { AuthProvider, useAuth } from './context';
export type { AuthProviderProps } from './context';

// Audit logging hook
export { useAuditLog } from './hooks/useAuditLog';
export type { UseAuditLogReturn } from './hooks/useAuditLog';

// Authentication guards
export { ProtectedRoute, RoleGuard, EmailVerificationGuard } from './guards';
export type { ProtectedRouteProps, RoleGuardProps, EmailVerificationGuardProps } from './guards';

// Organization selector components
export { SchoolSelector, DistrictSelector, VenueSelector } from './components';
export type { 
  SchoolSelectorProps, 
  School, 
  DistrictSelectorProps, 
  District, 
  VenueSelectorProps, 
  Venue 
} from './components';

// Login page component
export { default as LoginPage } from './components/LoginPage';
export type { LoginPageProps } from './components/LoginPage';

// Email verification reminder banner
export { EmailVerificationReminderBanner } from './components/EmailVerificationReminderBanner';
export type { EmailVerificationReminderBannerProps } from './components/EmailVerificationReminderBanner';

// Role switcher component
export { RoleSwitcher } from './components/RoleSwitcher';
export type { RoleSwitcherProps } from './components/RoleSwitcher';

// Navigation component
export { Navigation } from './components/Navigation';
export type { NavigationProps } from './components/Navigation';

// Login tracking
export { useLoginTracker, formatLastLogin } from './use-login-tracker';

// Email verification resend
export { resendVerificationEmail, getRemainingAttempts, clearResendAttempts } from './resend-verification';
