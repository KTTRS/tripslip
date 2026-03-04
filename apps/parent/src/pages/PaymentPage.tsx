import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PaymentForm } from '../components/PaymentForm';
import { AddOnSelector, type AdditionalFee } from '../components/AddOnSelector';
import { SplitPaymentForm } from '../components/SplitPaymentForm';
import { supabase } from '../lib/supabase';
import { Logger } from '@tripslip/utils';

const logger = new Logger();

interface PermissionSlipData {
  id: string;
  student_id: string;
  trip_id: string;
  status: string;
  students: {
    first_name: string;
    last_name: string;
  };
  trips: {
    title: string;
    estimated_cost_cents: number;
    trip_date: string;
    experiences: {
      title: string;
      add_ons?: Array<{
        id: string;
        name: string;
        description: string;
        price_cents: number;
        required?: boolean;
      }>;
    };
  };
}

export function PaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slipId = searchParams.get('slip');
  const token = searchParams.get('token');

  const [slip, setSlip] = useState<PermissionSlipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!slipId || !token) {
      setError(t('payment.invalidLink'));
      setLoading(false);
      return;
    }

    fetchPermissionSlip();
  }, [slipId, token, t]);

  const fetchPermissionSlip = async () => {
    if (!slipId || !token) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('permission_slips')
        .select(`
          *,
          students (
            first_name,
            last_name
          ),
          trips (
            title,
            estimated_cost_cents,
            trip_date,
            experiences (
              title,
              add_ons
            )
          )
        `)
        .eq('id', slipId)
        .eq('magic_link_token', token)
        .single();

      if (fetchError || !data) {
        throw new Error('Permission slip not found or payment link has expired');
      }

      // Check if already paid
      if (data.status === 'paid') {
        setError(t('payment.alreadyPaid'));
        setLoading(false);
        return;
      }

      // Check if not signed yet
      if (data.status !== 'signed_pending_payment') {
        setError(t('payment.notReadyForPayment'));
        setLoading(false);
        return;
      }

      setSlip(data as any);
      setTotalAmount((data as any).trips.estimated_cost_cents);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment information');
      setLoading(false);
    }
  };

  const handleAddOnChange = (totalCents: number) => {
    setTotalAmount(totalCents);
  };

  const handlePaymentSuccess = () => {
    logger.info('Payment completed successfully', {
      slipId: slip?.id,
      amount: totalAmount,
    });

    navigate(`/payment/success?slip=${slipId}&token=${token}`);
  };

  const handlePaymentError = (errorMessage: string) => {
    logger.error('Payment failed', new Error(errorMessage), {
      slipId: slip?.id,
      amount: totalAmount,
    });

    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !slip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('payment.errorTitle')}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t('payment.notFound')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  // Convert add-ons to the expected format
  const addOns: AdditionalFee[] = slip.trips.experiences.add_ons?.map(addOn => ({
    name: addOn.name,
    amountCents: addOn.price_cents,
    required: addOn.required || false,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('payment.title')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('payment.subtitle', {
              studentName: `${slip.students.first_name} ${slip.students.last_name}`,
              tripTitle: slip.trips.experiences.title,
            })}
          </p>
        </div>

        {/* Trip Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('payment.tripSummary')}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.trip')}</span>
              <span className="font-medium">{slip.trips.experiences.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.student')}</span>
              <span className="font-medium">
                {slip.students.first_name} {slip.students.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('payment.date')}</span>
              <span className="font-medium">
                {new Date(slip.trips.trip_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Add-ons Selection */}
        {addOns.length > 0 && (
          <AddOnSelector
            addOns={addOns}
            basePriceCents={slip.trips.estimated_cost_cents}
            onTotalChange={handleAddOnChange}
          />
        )}

        {/* Split Payment Option */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('payment.paymentOptions')}
            </h2>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSplitPayment}
                onChange={(e) => setIsSplitPayment(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">
                {t('payment.enableSplitPayment')}
              </span>
            </label>
          </div>

          {isSplitPayment ? (
            <SplitPaymentForm
              permissionSlipId={slip.id}
              totalAmountCents={totalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <PaymentForm
              permissionSlipId={slip.id}
              amountCents={totalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {t('payment.paymentError')}
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {t('payment.securityNotice')}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {t('payment.secureProcessing')}</li>
            <li>• {t('payment.noStoredCards')}</li>
            <li>• {t('payment.receiptEmail')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}