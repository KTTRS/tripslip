import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { supabase } from '../lib/supabase';
import { createRBACAuthService, SchoolSelector, DistrictSelector } from '@tripslip/auth';

const authService = createRBACAuthService(supabase);

type AdminRole = 'school_admin' | 'district_admin';

export default function SignupPage() {
  const navigate = useNavigate();
  const [adminRole, setAdminRole] = useState<AdminRole>('school_admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    schoolName: '',
    districtName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (adminRole === 'school_admin' && (!formData.schoolName || formData.schoolName.trim().length < 2)) {
      errors.schoolName = 'Please enter your school name';
    } else if (adminRole === 'district_admin' && (!formData.districtName || formData.districtName.trim().length < 2)) {
      errors.districtName = 'Please enter your district name';
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
      const organizationType = adminRole === 'school_admin' ? 'school' : 'district';
      const endpoint = adminRole === 'school_admin'
        ? '/api/signup/find-or-create-school'
        : '/api/signup/find-or-create-district';
      const orgName = adminRole === 'school_admin' ? formData.schoolName : formData.districtName;

      const orgRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      const orgData = await orgRes.json();
      if (!orgRes.ok) {
        throw new Error(orgData.error || 'Failed to set up organization');
      }

      const result = await authService.signUp({
        email: formData.email,
        password: formData.password,
        role: adminRole,
        organization_type: organizationType,
        organization_id: orgData.id,
        metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        },
      });

      navigate('/verify-email', {
        state: {
          email: formData.email,
          requiresVerification: result.requiresEmailVerification,
          role: adminRole,
        },
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message?.includes('Invalid email')) {
        setFieldErrors({ email: 'Please enter a valid email address' });
      } else if (err.message?.includes('Password')) {
        setFieldErrors({ password: err.message });
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
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
            Create Administrator Account
          </CardTitle>
          <p className="text-sm text-gray-600 text-center mt-2">
            Sign up to manage your school or district
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
              <label className="block text-sm font-medium mb-2">
                Administrator Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdminRole('school_admin')}
                  className={`px-4 py-3 border-2 border-black rounded font-medium transition-colors ${
                    adminRole === 'school_admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  School Admin
                </button>
                <button
                  type="button"
                  onClick={() => setAdminRole('district_admin')}
                  className={`px-4 py-3 border-2 border-black rounded font-medium transition-colors ${
                    adminRole === 'district_admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  District Admin
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {adminRole === 'school_admin'
                  ? 'Manage a single school'
                  : 'Manage all schools in a district'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
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
                placeholder="admin@school.edu"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {adminRole === 'school_admin' ? (
              <SchoolSelector
                supabase={supabase}
                value={formData.schoolName}
                onChange={(schoolName: string) => setFormData({ ...formData, schoolName })}
                error={fieldErrors.schoolName}
              />
            ) : (
              <DistrictSelector
                supabase={supabase}
                value={formData.districtName}
                onChange={(districtName: string) => setFormData({ ...formData, districtName })}
                error={fieldErrors.districtName}
              />
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password *
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
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className={`w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  fieldErrors.confirmPassword ? 'border-red-500' : ''
                }`}
                placeholder="••••••••"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-offset"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
