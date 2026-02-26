import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { createAuthService } from '@tripslip/auth';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const authService = createAuthService(supabase);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for success message from password reset
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign in with email and password
      const { user } = await authService.signInWithPassword(email, password);

      // Verify teacher account is associated with school
      const { data: teacher, error: teacherError } = await (supabase as any)
        .from('teachers')
        .select('id, school_id, is_active')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        setError('Teacher account not found. Please contact your school administrator.');
        await authService.signOut();
        return;
      }

      // Check if teacher account is deactivated
      if (!teacher.is_active) {
        setError('Your account has been deactivated. Please contact your school administrator.');
        await authService.signOut();
        return;
      }

      // Update session to last 7 days
      await supabase.auth.updateUser({
        data: {
          teacher_id: teacher.id,
          school_id: teacher.school_id,
        },
      });

      // Navigate to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            TripSlip Teacher Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-green-50 border-2 border-green-500 rounded text-green-700 text-sm">
                {successMessage}
              </div>
            )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="teacher@school.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full shadow-offset"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
