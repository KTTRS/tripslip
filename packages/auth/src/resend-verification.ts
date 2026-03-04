import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Rate limiting for verification email resends
 * Max 3 resends per hour per email
 */
const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ResendAttempt {
  email: string;
  timestamp: number;
}

// In-memory storage for resend attempts (in production, use database)
const resendAttempts: ResendAttempt[] = [];

/**
 * Check if user has exceeded resend limit
 */
function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number } {
  const now = Date.now();
  const windowStart = now - RESEND_WINDOW_MS;
  
  // Clean up old attempts
  const recentAttempts = resendAttempts.filter(
    attempt => attempt.timestamp > windowStart
  );
  resendAttempts.length = 0;
  resendAttempts.push(...recentAttempts);
  
  // Count attempts for this email
  const emailAttempts = recentAttempts.filter(
    attempt => attempt.email === email
  );
  
  const remainingAttempts = Math.max(0, RESEND_LIMIT - emailAttempts.length);
  const allowed = emailAttempts.length < RESEND_LIMIT;
  
  return { allowed, remainingAttempts };
}

/**
 * Record a resend attempt
 */
function recordAttempt(email: string): void {
  resendAttempts.push({
    email,
    timestamp: Date.now(),
  });
}

/**
 * Resend verification email using Supabase Auth
 * 
 * @param supabase - Supabase client instance
 * @param email - User's email address
 * @returns Success status and message
 */
export async function resendVerificationEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{ success: boolean; message: string; remainingAttempts?: number }> {
  try {
    // Check rate limit
    const { allowed, remainingAttempts } = checkRateLimit(email);
    
    if (!allowed) {
      return {
        success: false,
        message: 'Too many resend attempts. Please try again later.',
        remainingAttempts: 0,
      };
    }
    
    // Resend verification email using Supabase Auth
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('already confirmed')) {
        return {
          success: false,
          message: 'Your email is already verified. You can log in now.',
          remainingAttempts,
        };
      }
      
      if (error.message.includes('not found')) {
        return {
          success: false,
          message: 'No account found with this email address.',
          remainingAttempts,
        };
      }
      
      throw error;
    }
    
    // Record successful attempt
    recordAttempt(email);
    
    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.',
      remainingAttempts: remainingAttempts - 1,
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.',
      remainingAttempts: checkRateLimit(email).remainingAttempts,
    };
  }
}

/**
 * Get remaining resend attempts for an email
 */
export function getRemainingAttempts(email: string): number {
  return checkRateLimit(email).remainingAttempts;
}

/**
 * Clear resend attempts for an email (for testing)
 */
export function clearResendAttempts(email?: string): void {
  if (email) {
    const index = resendAttempts.findIndex(attempt => attempt.email === email);
    if (index !== -1) {
      resendAttempts.splice(index, 1);
    }
  } else {
    resendAttempts.length = 0;
  }
}
