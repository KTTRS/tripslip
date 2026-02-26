import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Contributor {
  id: string;
  parentId: string;
  email: string;
  amountCents: number;
  status: 'pending' | 'paid' | 'failed';
}

interface SplitPaymentFormProps {
  slipId: string;
  totalAmount: number;
  tripName: string;
  studentName: string;
  splitPaymentGroupId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function SplitPaymentFormInner({
  slipId,
  totalAmount,
  tripName,
  studentName,
  splitPaymentGroupId,
  onSuccess,
  onError
}: SplitPaymentFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [myContribution, setMyContribution] = useState(0);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [remainingBalance, setRemainingBalance] = useState(totalAmount);

  // Fetch existing contributors
  useEffect(() => {
    const fetchContributors = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('split_payment_group_id', splitPaymentGroupId);

      if (error) {
        console.error('Error fetching contributors:', error);
        return;
      }

      const mappedContributors: Contributor[] = (data || []).map((payment: any) => ({
        id: payment.id,
        parentId: payment.parent_id || '',
        email: payment.parent_email || 'Unknown',
        amountCents: payment.amount_cents,
        status: payment.status === 'succeeded' ? 'paid' : payment.status
      }));

      setContributors(mappedContributors);

      // Calculate remaining balance
      const paidAmount = mappedContributors
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amountCents, 0);
      
      setRemainingBalance(totalAmount - paidAmount);
    };

    fetchContributors();
  }, [splitPaymentGroupId, totalAmount]);

  const handleCreatePaymentIntent = async () => {
    if (myContribution <= 0 || myContribution > remainingBalance) {
      onError('Please enter a valid contribution amount');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          permissionSlipId: slipId,
          amountCents: myContribution,
          isSplitPayment: true,
          splitPaymentGroupId
        }
      });

      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      onError(err.message || 'Failed to initialize payment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?slip_id=${slipId}`
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('tripDetails')}</span>
          <span className="font-semibold">{tripName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Student</span>
          <span className="font-semibold">{studentName}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="font-semibold">${(totalAmount / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-blue-600">Remaining Balance</span>
          <span className="text-lg font-bold text-blue-600">
            ${(remainingBalance / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {contributors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700">Contributors:</h4>
          <div className="space-y-1">
            {contributors.map(contributor => (
              <div key={contributor.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{contributor.email}</span>
                <span className={`font-medium ${
                  contributor.status === 'paid' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  ${(contributor.amountCents / 100).toFixed(2)} - {contributor.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!clientSecret ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="contribution" className="block text-sm font-medium text-gray-700 mb-2">
              {t('amountYouCanPay')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="contribution"
                type="number"
                min="0.01"
                max={(remainingBalance / 100).toFixed(2)}
                step="0.01"
                value={(myContribution / 100).toFixed(2)}
                onChange={(e) => setMyContribution(Math.round(parseFloat(e.target.value || '0') * 100))}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {t('fullCostIs', { amount: (totalAmount / 100).toFixed(2) })}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreatePaymentIntent}
            disabled={myContribution <= 0 || myContribution > remainingBalance}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Payment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : `${t('pay')} $${(myContribution / 100).toFixed(2)}`}
          </button>
        </form>
      )}
    </div>
  );
}

export function SplitPaymentForm(props: SplitPaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
      <SplitPaymentFormInner {...props} />
    </Elements>
  );
}
