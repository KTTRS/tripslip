import { useTranslation } from '@tripslip/i18n';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';

export function SessionExpiredPage() {
  const { t } = useTranslation();

  const handleResend = () => {
    // In a real implementation, this would call an Edge Function to resend the magic link
    alert(t('auth.resendSuccess'));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="border-2 border-black shadow-offset-lg max-w-md w-full">
        <CardHeader>
          <CardTitle>{t('auth.error')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">{t('auth.sessionExpired')}</p>
          <div className="space-y-2">
            <Button
              onClick={handleResend}
              className="w-full shadow-offset"
            >
              {t('auth.resendLink')}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              {t('auth.contactTeacher')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
