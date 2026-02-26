import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  slipId: string;
  amount: number;
  tripName: string;
  studentName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentFormInner({ slipId, amount, tripName, studentName, onSuccess, onError }: PaymentFormProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create payment intent when component mounts
  useState(() => {
    const createPaymentIntent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            permissionSlipId: slipId,
            amountCents: amount,
            isSplitPayment: false
          }
        });

        if (error) throw error;
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        onError(err.message || 'Failed to initialize payment');
      }
    };

    createPaymentIntent();
  });

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

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <span className="text-lg font-semibold">{t('cost')}</span>
          <span className="text-lg font-bold text-blue-600">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? t('processing') || 'Processing...' : `${t('pay')} $${(amount / 100).toFixed(2)}`}
      </button>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}
