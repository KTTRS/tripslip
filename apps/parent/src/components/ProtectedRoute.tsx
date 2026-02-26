import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '@tripslip/i18n';
import { Card, CardContent } from '@tripslip/ui';
import { isSessionValid } from '../lib/session';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isSessionValid()) {
      // Session expired or doesn't exist
      navigate('/session-expired');
    }
  }, [navigate]);

  if (!isSessionValid()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="border-2 border-black shadow-offset-lg max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-700">{t('auth.verifying')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
