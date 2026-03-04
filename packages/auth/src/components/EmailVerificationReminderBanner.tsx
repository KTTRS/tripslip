/**
 * Email Verification Reminder Banner
 * Displays a banner on protected pages if email is unverified
 * Includes resend verification email button with countdown timer
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@tripslip/ui';
import { createRBACAuthService } from '../rbac-service-impl';
import type { SupabaseClient } from '@tripslip/database';

export interface EmailVerificationReminderBannerProps {
  /**
   * Supabase client instance
   */
  supabase: SupabaseClient;
  
  /**
   * User's email address
   */
  email: string;
  
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Whether the banner can be dismissed
   * @default true
   */
  dismissible?: boolean;
}

/**
 * Banner component that reminds users to verify their email
 * Includes a resend button with 60-second countdown to prevent spam
 */
export function EmailVerificationReminderBanner({
  supabase,
  email,
  onDismiss,
  dismissible = true,
}: EmailVerificationReminderBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const authService = createRBACAuthService(supabase);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      await authService.resendVerificationEmail();
      setResendSuccess(true);
      setCountdown(60); // Start 60-second countdown
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error('Failed to resend verification email:', error);
      setResendError(error.message || 'Failed to resend verification email. Please try again.');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setResendError(null);
      }, 5000);
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b-2 border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Please verify your email address
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                We sent a verification link to <span className="font-semibold">{email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {resendSuccess && (
              <span className="text-xs text-green-700 font-medium">
                Verification email sent!
              </span>
            )}
            
            {resendError && (
              <span className="text-xs text-red-700 font-medium">
                {resendError}
              </span>
            )}

            <Button
              onClick={handleResendVerification}
              disabled={isResending || countdown > 0}
              size="sm"
              variant="outline"
              className="text-xs border-yellow-300 hover:bg-yellow-100 disabled:opacity-50"
            >
              {isResending ? (
                'Sending...'
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend verification email'
              )}
            </Button>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-yellow-600 hover:text-yellow-800 p-1"
                aria-label="Dismiss"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
