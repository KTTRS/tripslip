import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

export function PaymentSuccessPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slipData, setSlipData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const slipId = searchParams.get('slip_id');

      if (!slipId) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }

      try {
        // Fetch updated permission slip
        const { data: slip, error: slipError } = await supabase
          .from('permission_slips')
          .select(`
            *,
            student_id,
            invitation_id
          `)
          .eq('id', slipId)
          .single();

        if (slipError) throw slipError;

        setSlipData(slip);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('processing')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('paymentFailed')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('retryPayment')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('paymentSuccess')}</h1>
        <p className="text-gray-600 mb-6">{t('youreAllSet')}</p>

        {slipData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t('status')}</span>
              <span className="text-sm font-semibold text-green-600">
                {slipData.status === 'paid' ? t('paymentConfirmed') : t('paymentPending')}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          {t('paymentConfirmationSent')}
        </p>

        <button
          onClick={() => navigate(`/slip/${slipData?.id}`)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Permission Slip
        </button>
      </div>
    </div>
  );
}
