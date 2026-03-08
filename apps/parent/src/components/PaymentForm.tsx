import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@tripslip/ui';
import { createPaymentIntent } from '../services/payment-service';
import { useTranslation } from 'react-i18next';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  permissionSlipId: string;
  amountCents: number;
  parentId?: string;
  isSplitPayment?: boolean;
  onSuccess: () => void;
  onError?: (error: string) => void;
}

function PaymentFormInner({ 
  permissionSlipId, 
  amountCents, 
  parentId,
  isSplitPayment,
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const PAYMENT_TIMEOUT_MS = 30000;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Payment is taking longer than expected. Your card has not been charged. Please try again.'));
        }, PAYMENT_TIMEOUT_MS);
      });

      const paymentFlow = async () => {
        const { clientSecret } = await createPaymentIntent({
          permissionSlipId,
          amountCents,
          parentId,
          isSplitPayment,
        });

        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/payment/success`,
          },
        });

        if (confirmError) {
          throw new Error(confirmError.message || t('payment.error', 'Payment failed. Please try again.'));
        }
      };

      await Promise.race([paymentFlow(), timeoutPromise]);

      if (timeoutId) clearTimeout(timeoutId);
      onSuccess();
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      const errorMessage = err instanceof Error 
        ? err.message 
        : t('payment.error', 'An error occurred. Please try again.');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
            {t('payment.totalAmount', 'Total Amount')}
          </span>
          <span className="text-2xl font-bold text-[#0A0A0A] font-['Space_Mono']">
            {formattedAmount}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div 
          className="p-4 bg-red-50 border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
            {error}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing 
          ? t('payment.processing', 'Processing...') 
          : t('payment.payNow', `Pay ${formattedAmount}`)}
      </Button>

      {/* Processing State Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
          <div className="size-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
          <span>{t('payment.processingMessage', 'Securely processing your payment...')}</span>
        </div>
      )}
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}
