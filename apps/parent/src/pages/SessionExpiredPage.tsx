import { useState } from 'react';
import { useTranslation } from '@tripslip/i18n';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';

export function SessionExpiredPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSent(true);
    setSending(false);
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
            {sent ? (
              <div className="p-3 bg-green-50 border-2 border-green-500 rounded text-green-700 text-sm text-center">
                {t('auth.resendSuccess', 'A new link has been sent! Please check your messages.')}
              </div>
            ) : (
              <Button
                onClick={handleResend}
                disabled={sending}
                className="w-full shadow-offset"
              >
                {sending ? 'Sending...' : t('auth.resendLink')}
              </Button>
            )}
            <p className="text-sm text-gray-600 text-center">
              {t('auth.contactTeacher')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
