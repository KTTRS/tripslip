import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { createSupabaseClient } from '@tripslip/database';
import { validatePassword } from '../utils/passwordValidation';

const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password requirements
    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Success - redirect to login
      navigate('/login', {
        state: { message: 'Password reset successful. Please sign in with your new password.' }
      });
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-offset">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Set New Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-500 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded text-sm">
              <p className="font-medium mb-2">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>At least 8 characters long</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
              </ul>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              {validationErrors.length > 0 && password.length > 0 && (
                <p className="text-xs text-red-600 mt-1">{validationErrors[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || validationErrors.length > 0}
              className="w-full shadow-offset"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
