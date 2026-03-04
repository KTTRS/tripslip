/**
 * Email Verification Page
 * Handles email verification from URL token or displays verification notice
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { createRBACAuthService } from '@tripslip/auth';

const authService = createRBACAuthService(supabase);

type VerificationState = 'pending' | 'verifying' | 'success' | 'error' | 'expired';

export default function EmailVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = location.state?.email || '';
  
  const [state, setState] = useState<VerificationState>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Check if there's a token in the URL
    const token = searchParams.get('token') || searchParams.get('token_hash');
    
    if (token) {
      verifyEmailWithToken(token);
    }
  }, [searchParams]);

  const verifyEmailWithToken = async (token: string) => {
    setState('verifying');
    
    try {
      await authService.verifyEmail(token);
      setState('success');
    } catch (error: any) {
      console.error('Email verification error:', error);
      
      // Check if token is expired
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setState('expired');
        setErrorMessage('This verification link has expired or is invalid.');
      } else {
        setState('error');
        setErrorMessage(error.message || 'Failed to verify email. Please try again.');
      }
    }
  };

  // Success state
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-black shadow-offset">
          <CardHeader>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Email Verified!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-gray-700">
                Your email has been successfully verified. You can now sign in to your account.
              </p>

              <Button
                onClick={() => navigate('/login')}
                className="w-full shadow-offset"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or expired state
  if (state === 'error' || state === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-black shadow-offset">
          <CardHeader>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-center text-gray-700">
                {errorMessage}
              </p>

              {state === 'expired' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Need a new verification link?</strong>
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please log in to your account and request a new verification email.
                  </p>
                </div>
              )}

              <Button
                onClick={() => navigate('/login')}
                className="w-full shadow-offset"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifying state
  if (state === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-black shadow-offset">
          <CardHeader>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Verifying Email...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">
              Please wait while we verify your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default pending state (no token in URL)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-offset">
        <CardHeader>
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-gray-700">
              We've sent a verification link to:
            </p>
            <p className="text-center font-semibold text-gray-900">
              {email}
            </p>
            <p className="text-center text-sm text-gray-600">
              Click the link in the email to verify your account and complete the signup process.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes and check again</li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className="w-full shadow-offset"
            >
              Go to Login
            </Button>

            <div className="text-center text-sm text-gray-600">
              <p>
                Once verified, you can{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  sign in to your account
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
