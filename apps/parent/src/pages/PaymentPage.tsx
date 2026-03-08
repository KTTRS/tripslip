import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PaymentForm } from '../components/PaymentForm';
import { AddOnSelector, type AdditionalFee } from '../components/AddOnSelector';
import { SplitPaymentForm } from '../components/SplitPaymentForm';
import { supabase } from '../lib/supabase';
import { Logger } from '@tripslip/utils';

const logger = new Logger();
const FETCH_TIMEOUT_MS = 15000;

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
  const [payItForwardAmount, setPayItForwardAmount] = useState(0);
  const [customPayItForward, setCustomPayItForward] = useState('');
  const [isTimeout, setIsTimeout] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!slipId || !token) {
      setError(t('payment.invalidLink'));
      setLoading(false);
      return;
    }

    fetchPermissionSlip();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [slipId, token, t]);

  const fetchPermissionSlip = async () => {
    if (!slipId || !token) return;

    fetchTimeoutRef.current = setTimeout(() => {
      if (loading) {
        setIsTimeout(true);
        setError('The payment page is taking longer than expected to load. Please check your internet connection and try again.');
        setLoading(false);
      }
    }, FETCH_TIMEOUT_MS);

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
            trip_date,
            is_free,
            experiences (
              title,
              pricing_tiers (
                min_students,
                max_students,
                price_cents
              )
            )
          )
        `)
        .eq('id', slipId)
        .eq('magic_link_token', token)
        .single();

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

      if (fetchError || !data) {
        throw new Error('Permission slip not found or payment link has expired');
      }

      if (data.status === 'paid') {
        setError(t('payment.alreadyPaid'));
        setLoading(false);
        return;
      }

      if (data.status !== 'signed_pending_payment') {
        setError(t('payment.notReadyForPayment'));
        setLoading(false);
        return;
      }

      setSlip(data as any);
      const tripData = data.trips as any;
      const pricingTiers = tripData?.experiences?.pricing_tiers;
      const baseCost = pricingTiers?.[0]?.price_cents || 0;
      setTotalAmount(baseCost);
      setLoading(false);
    } catch (err) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      setError(err instanceof Error ? err.message : 'Failed to load payment information');
      setLoading(false);
    }
  };

  const handleAddOnChange = (totalCents: number) => {
    setTotalAmount(totalCents);
  };

  const handlePayItForwardSelect = (amount: number) => {
    if (payItForwardAmount === amount) {
      setPayItForwardAmount(0);
      setCustomPayItForward('');
    } else {
      setPayItForwardAmount(amount);
      setCustomPayItForward('');
    }
  };

  const handleCustomPayItForward = (value: string) => {
    setCustomPayItForward(value);
    const cents = Math.round(parseFloat(value || '0') * 100);
    setPayItForwardAmount(isNaN(cents) || cents < 0 ? 0 : cents);
  };

  const finalTotal = totalAmount + payItForwardAmount;

  const updateAssistanceFund = async () => {
    if (!slip || payItForwardAmount <= 0) return;
    try {
      await supabase.rpc('increment_assistance_fund', {
        p_trip_id: slip.trip_id,
        p_amount: payItForwardAmount,
      });
    } catch {
      try {
        const { data: tripData } = await supabase
          .from('trips')
          .select('assistance_fund_cents')
          .eq('id', slip.trip_id)
          .single();
        const current = (tripData as any)?.assistance_fund_cents || 0;
        await supabase
          .from('trips')
          .update({ assistance_fund_cents: current + payItForwardAmount })
          .eq('id', slip.trip_id);
      } catch {
        logger.warn('Could not update assistance fund', { tripId: slip.trip_id });
      }
    }
  };

  const handlePaymentSuccess = async () => {
    logger.info('Payment completed successfully', {
      slipId: slip?.id,
      amount: finalTotal,
      payItForward: payItForwardAmount,
    });

    await updateAssistanceFund();
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
        <div className="max-w-md w-full bg-white border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] p-6 text-center">
          <div className="text-5xl mb-4">{isTimeout ? '⏱️' : '⚠️'}</div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] mb-4">
            {isTimeout
              ? t('payment.timeoutTitle', 'Connection Timeout')
              : t('payment.errorTitle', 'Payment Error')}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || t('payment.notFound')}
          </p>
          {isTimeout && (
            <button
              onClick={() => {
                setError(null);
                setIsTimeout(false);
                setLoading(true);
                fetchPermissionSlip();
              }}
              className="px-6 py-3 bg-[#F5C518] text-[#0A0A0A] font-bold rounded-lg border-2 border-[#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A] transition-all mb-3 w-full"
            >
              {t('common.tryAgain', 'Try Again')}
            </button>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#0A0A0A] text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors w-full"
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

        {/* Pay-It-Forward Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#F5C518]">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl" role="img" aria-label="heart">💛</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Help Another Family
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Contribute a little extra to help cover costs for families who need financial assistance. No child should miss out on a field trip.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {[500, 1000, 2500].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handlePayItForwardSelect(amount)}
                className={`px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all duration-200 ${
                  payItForwardAmount === amount && customPayItForward === ''
                    ? 'bg-[#F5C518] border-[#0A0A0A] text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-[#F5C518] hover:bg-yellow-50'
                }`}
              >
                +${(amount / 100).toFixed(0)}
              </button>
            ))}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Other"
                value={customPayItForward}
                onChange={(e) => handleCustomPayItForward(e.target.value)}
                className={`w-24 pl-7 pr-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all duration-200 ${
                  customPayItForward !== ''
                    ? 'border-[#0A0A0A] bg-[#F5C518] shadow-[3px_3px_0px_#0A0A0A]'
                    : 'border-gray-300 hover:border-[#F5C518]'
                }`}
                aria-label="Custom contribution amount"
              />
            </div>
          </div>

          {payItForwardAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Your contribution to the assistance fund:
              </span>
              <span className="font-bold text-[#0A0A0A]">
                +${(payItForwardAmount / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>

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

          {payItForwardAmount > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trip cost</span>
                <span className="font-medium">${(totalAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Pay-it-forward 💛</span>
                <span className="font-medium">+${(payItForwardAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-300 font-bold">
                <span>Total</span>
                <span>${(finalTotal / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {isSplitPayment ? (
            <SplitPaymentForm
              permissionSlipId={slip.id}
              totalAmountCents={finalTotal}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <PaymentForm
              permissionSlipId={slip.id}
              amountCents={finalTotal}
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