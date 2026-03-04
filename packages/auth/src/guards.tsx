/**
 * Authentication Guards
 * React components that protect routes and content based on authentication and authorization
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './context';
import { resendVerificationEmail } from './resend-verification';
import type { UserRole } from './types';
import { logger } from '@tripslip/utils';
import { createSupabaseClient } from '@tripslip/database';

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

/**
 * Protected route component
 * Requires authentication to access the wrapped content
 * Optionally requires specific roles or email verification
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requireEmailVerification = false,
  redirectTo = '/login',
}: ProtectedRouteProps): JSX.Element {
  const { user, loading, isAuthenticated, isEmailVerified, hasRole } = useAuth();
  const location = useLocation();

  // Store originally requested URL for post-login redirect
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    }
  }, [isAuthenticated, loading, location]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !isEmailVerified) {
    return <Navigate to="/verify-email-reminder" replace />;
  }

  // Check required roles if specified
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Props for RoleGuard component
 */
export interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Role guard component
 * Only renders children if user has one of the required roles
 * Optionally renders a fallback component if user doesn't have required role
 */
export function RoleGuard({
  children,
  requiredRoles,
  fallback,
}: RoleGuardProps): JSX.Element | null {
  const { hasRole, loading } = useAuth();

  if (loading) {
    return null;
  }

  const hasRequiredRole = requiredRoles.some(role => hasRole(role));

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this resource.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Props for EmailVerificationGuard component
 */
export interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

/**
 * Email verification guard component
 * Displays a verification reminder banner if email is not verified
 * Still allows access to content but encourages verification
 */
export function EmailVerificationGuard({
  children,
}: EmailVerificationGuardProps): JSX.Element {
  const { isEmailVerified, user } = useAuth();
  const [showBanner, setShowBanner] = React.useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleResendEmail = async () => {
    if (!user?.email || resending) return;

    setResending(true);
    setResendMessage(null);

    try {
      const supabase = createSupabaseClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const result = await resendVerificationEmail(supabase, user.email);
      
      setResendMessage(result.message);
      setRemainingAttempts(result.remainingAttempts ?? null);
      
      if (result.success) {
        logger.info('Verification email resent successfully', { email: user.email });
      } else {
        logger.warn('Failed to resend verification email', { 
          email: user.email, 
          message: result.message 
        });
      }
    } catch (error) {
      logger.error('Error resending verification email', { error });
      setResendMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (isEmailVerified || !user) {
    return <>{children}</>;
  }

  return (
    <>
      {showBanner && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap">
              <div className="flex-1 flex items-center">
                <span className="flex p-2 rounded-lg bg-yellow-100">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </span>
                <div className="ml-3">
                  <p className="font-medium text-yellow-800">
                    Please verify your email address to access all features.
                  </p>
                  {resendMessage && (
                    <p className={`text-sm mt-1 ${resendMessage.includes('sent') ? 'text-green-700' : 'text-red-700'}`}>
                      {resendMessage}
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <span className="ml-2 text-yellow-700">
                          ({remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-2">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || (remainingAttempts !== null && remainingAttempts === 0)}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : 'Resend Email'}
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-yellow-800 hover:text-yellow-900"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
