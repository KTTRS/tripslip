/**
 * Shared Login Page Component
 * Provides login functionality with role-based redirect
 */

import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import type { SupabaseClient } from '@tripslip/database';
import type { RBACAuthService } from '../rbac-service';
import type { UserRole } from '../types';

export interface LoginPageProps {
  supabase: SupabaseClient;
  authService: RBACAuthService;
  onLoginSuccess?: (role: UserRole) => void;
  signupPath?: string;
  passwordResetPath?: string;
}

export default function LoginPage({
  supabase,
  authService,
  onLoginSuccess,
  signupPath = '/signup',
  passwordResetPath = '/reset-password',
}: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sign in with RBAC auth service
      const result = await authService.signIn(formData.email, formData.password);

      // Get the originally requested URL from location state, or determine redirect based on role
      const from = (location.state as any)?.from?.pathname;
      
      if (onLoginSuccess) {
        // Let parent component handle redirect
        onLoginSuccess(result.activeRole.role_name);
      } else if (from) {
        // Redirect to originally requested URL
        navigate(from, { replace: true });
      } else {
        // Default role-based redirect
        const redirectPath = getRoleBasedRedirect(result.activeRole.role_name);
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Use generic error message for security (don't reveal if email exists)
      if (err.message?.includes('Invalid login credentials') || 
          err.message?.includes('Invalid email or password') ||
          err.message?.includes('Authentication failed')) {
        setError('Invalid email or password');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <p className="text-sm text-gray-600 text-center mt-2">
            Welcome back! Please sign in to continue
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-500 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.email ? 'border-red-500' : ''
                }`}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.password ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate(passwordResetPath)}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-offset"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={() => navigate(signupPath)}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Helper function to determine redirect path based on user role
 */
function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case 'teacher':
      return '/dashboard';
    case 'school_admin':
      return '/dashboard';
    case 'district_admin':
      return '/district-admin';
    case 'tripslip_admin':
      return '/tripslip-admin';
    case 'venue_admin':
      return '/dashboard';
    case 'parent':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
