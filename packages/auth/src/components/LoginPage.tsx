/**
 * Shared Login Page Component
 * Provides login functionality with role-based redirect
 */

import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button, ClayIcon } from '@tripslip/ui';
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
      
      if (err.message?.includes('Invalid login credentials') || 
          err.message?.includes('Invalid email or password') ||
          err.message?.includes('Authentication failed')) {
        setError('Invalid email or password');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in');
      } else if (err.code === 'NO_ROLE_ASSIGNMENTS' || err.message?.includes('No role assignments')) {
        setError('Your account does not have the required role for this application.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50/30 via-white to-orange-50/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-12 left-12 opacity-60 animate-float pointer-events-none hidden md:block">
        <ClayIcon size="xl" color="yellow">
          <img src="/images/icon-bus.png" alt="" />
        </ClayIcon>
      </div>
      <div className="absolute bottom-16 right-16 opacity-50 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1.5s' }}>
        <ClayIcon size="xl" color="orange">
          <img src="/images/icon-backpack.png" alt="" />
        </ClayIcon>
      </div>
      <div className="absolute top-1/3 right-12 opacity-40 animate-float pointer-events-none hidden lg:block" style={{ animationDelay: '3s' }}>
        <ClayIcon size="lg" color="green">
          <img src="/images/icon-compass.png" alt="" />
        </ClayIcon>
      </div>

      <div className="flex items-center gap-8 w-full max-w-4xl">
        <div className="hidden lg:flex flex-col items-center flex-shrink-0">
          <img
            src="/images/char-yellow-star.png"
            alt="TripSlip mascot"
            className="w-48 h-48 object-contain animate-bounce-slow drop-shadow-lg"
          />
          <p className="mt-4 text-lg font-bold text-gray-700 text-center">
            Welcome back!
          </p>
          <p className="text-sm text-gray-500 text-center max-w-[200px]">
            Sign in to manage your field trips
          </p>
        </div>

        <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_#0A0A0A] rounded-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg border-2 border-black shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center">
                <span className="text-black font-black text-xl">T</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-gray-900">TripSlip</span>
            </div>
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
                <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-black ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-black ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
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
                  className="text-sm text-yellow-700 hover:text-yellow-900 hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full shadow-[3px_3px_0px_#0A0A0A] rounded-xl text-base font-bold hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0A0A0A] transition-all duration-150"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => navigate(signupPath)}
                  className="text-yellow-700 hover:text-yellow-900 hover:underline font-semibold transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
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
