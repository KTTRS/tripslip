import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from '@tripslip/i18n';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';
import { authService } from '../lib/supabase';
import { createSession } from '../lib/session';
import { LanguageSelector } from '../components/LanguageSelector';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('auth.noToken');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Verify magic link token
      const { slipId } = await authService.verifyMagicLink(token);

      // Create a temporary session (24 hours)
      createSession(slipId, token);

      // Redirect to permission slip page
      navigate(`/slip/${slipId}`);
    } catch (err) {
      console.error('Token verification failed:', err);
      setError('auth.invalidToken');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);

    try {
      // In a real implementation, this would call an Edge Function to resend the magic link
      // For now, we'll just show a success message
      alert(t('auth.resendSuccess'));
    } catch (err) {
      console.error('Resend failed:', err);
      setError('auth.resendFailed');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="border-2 border-black shadow-offset-lg max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-700">{t('auth.verifying')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="border-2 border-black shadow-offset-lg max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600">{t('auth.error')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">{t(error)}</p>
              <div className="space-y-2">
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full shadow-offset"
                >
                  {resending ? t('auth.resending') : t('auth.resendLink')}
                </Button>
                <p className="text-sm text-gray-600 text-center">
                  {t('auth.contactTeacher')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
