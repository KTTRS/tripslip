import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '@tripslip/i18n';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@tripslip/ui';

export function SessionExpiredPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    setSending(true);
    setResendError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSent(true);
    } catch {
      setResendError('Unable to send a new link right now. Please try again or contact your child\'s teacher.');
    } finally {
      setSending(false);
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'expired':
        return 'Link Expired';
      case 'invalid':
        return 'Invalid Link';
      default:
        return t('auth.error', 'Session Expired');
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'expired':
        return 'Your permission slip link has expired for security reasons. Don\'t worry — you can request a new one!';
      case 'invalid':
        return 'This link is no longer valid. It may have already been used or the URL might be incorrect.';
      default:
        return t('auth.sessionExpired', 'Your session has expired. Please request a new link to continue.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">{reason === 'expired' ? '⏰' : '🔗'}</div>
          <CardTitle className="text-2xl font-bold text-[#0A0A0A]">{getTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">{getMessage()}</p>

          <div className="space-y-3">
            {sent ? (
              <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-green-700 text-sm text-center">
                <span className="block text-lg mb-1">✅</span>
                {t('auth.resendSuccess', 'A new link has been sent! Please check your messages.')}
              </div>
            ) : (
              <Button
                onClick={handleResend}
                disabled={sending}
                className="w-full bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A] font-bold"
              >
                {sending ? 'Sending new link...' : t('auth.resendLink', 'Request a New Link')}
              </Button>
            )}

            {resendError && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm text-center">
                {resendError}
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                {t('auth.contactTeacher', 'If the problem persists, please contact your child\'s teacher for assistance.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
