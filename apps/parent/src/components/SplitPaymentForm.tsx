import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button, Input, Label } from '@tripslip/ui';
import { createPaymentIntent, getPaymentsByPermissionSlip, type Payment } from '../services/payment-service';
import { useTranslation } from 'react-i18next';
import { Logger } from '@tripslip/utils';

const logger = new Logger();
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface SplitPaymentFormProps {
  permissionSlipId: string;
  totalAmountCents: number;
  onSuccess: () => void;
  onError?: (error: string) => void;
}

function SplitPaymentFormInner({ 
  permissionSlipId, 
  totalAmountCents, 
  onSuccess, 
  onError 
}: SplitPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPayments, setExistingPayments] = useState<Payment[]>([]);
  const [contributionAmount, setContributionAmount] = useState<string>('');
  const [contributorName, setContributorName] = useState<string>('');
  const [contributorEmail, setContributorEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  // Load existing payments on mount
  useEffect(() => {
    loadExistingPayments();
  }, [permissionSlipId]);

  const loadExistingPayments = async () => {
    try {
      const payments = await getPaymentsByPermissionSlip(permissionSlipId);
      setExistingPayments(payments.filter(p => p.status === 'succeeded'));
      setLoading(false);
    } catch (err) {
      logger.error('Failed to load existing payments', err as Error, {
        permissionSlipId,
      });
      setLoading(false);
    }
  };

  const calculateRemainingBalance = () => {
    const paidAmount = existingPayments.reduce((sum, payment) => sum + payment.amount_cents, 0);
    return Math.max(0, totalAmountCents - paidAmount);
  };

  const calculatePaidAmount = () => {
    return existingPayments.reduce((sum, payment) => sum + payment.amount_cents, 0);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleContributionAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setContributionAmount(cleanValue);
  };

  const getContributionAmountCents = () => {
    const amount = parseFloat(contributionAmount || '0');
    return Math.round(amount * 100);
  };

  const validateForm = () => {
    const contributionCents = getContributionAmountCents();
    const remainingBalance = calculateRemainingBalance();

    if (!contributorName.trim()) {
      return t('splitPayment.validation.nameRequired', 'Contributor name is required');
    }

    if (!contributorEmail.trim()) {
      return t('splitPayment.validation.emailRequired', 'Contributor email is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail)) {
      return t('splitPayment.validation.emailInvalid', 'Please enter a valid email address');
    }

    if (contributionCents <= 0) {
      return t('splitPayment.validation.amountRequired', 'Contribution amount must be greater than $0');
    }

    if (contributionCents > remainingBalance) {
      return t('splitPayment.validation.amountTooHigh', 'Contribution amount cannot exceed remaining balance');
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const contributionCents = getContributionAmountCents();

      // Create payment intent for this contribution
      const { clientSecret } = await createPaymentIntent({
        permissionSlipId,
        amountCents: contributionCents,
        isSplitPayment: true,
        splitPaymentGroupId: permissionSlipId, // Use slip ID as group ID for simplicity
      });

      // Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?slip=${permissionSlipId}`,
          payment_method_data: {
            billing_details: {
              name: contributorName,
              email: contributorEmail,
            },
          },
        },
      });

      if (confirmError) {
        const errorMessage = confirmError.message || t('payment.error', 'Payment failed. Please try again.');
        setError(errorMessage);
        onError?.(errorMessage);
      } else {
        logger.info('Split payment contribution successful', {
          permissionSlipId,
          contributionCents,
          contributorName,
          contributorEmail,
        });
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : t('payment.error', 'An error occurred. Please try again.');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const remainingBalance = calculateRemainingBalance();
  const paidAmount = calculatePaidAmount();
  const isFullyPaid = remainingBalance === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="size-6 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
          {t('common.loading', 'Loading...')}
        </span>
      </div>
    );
  }

  if (isFullyPaid) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-[#0A0A0A] font-['Fraunces'] mb-2">
          {t('splitPayment.fullyPaid', 'Payment Complete')}
        </h3>
        <p className="text-sm text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
          {t('splitPayment.fullyPaidMessage', 'This trip has been fully paid for.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
        <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
          {t('splitPayment.paymentSummary', 'Payment Summary')}
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
              {t('splitPayment.totalCost', 'Total Cost')}
            </span>
            <span className="text-sm font-bold text-[#0A0A0A] font-['Space_Mono']">
              {formatCurrency(totalAmountCents)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
              {t('splitPayment.paidSoFar', 'Paid So Far')}
            </span>
            <span className="text-sm font-bold text-green-600 font-['Space_Mono']">
              {formatCurrency(paidAmount)}
            </span>
          </div>

          <div className="border-t-[2px] border-[#0A0A0A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('splitPayment.remainingBalance', 'Remaining Balance')}
              </span>
              <span className="text-xl font-bold text-[#0A0A0A] font-['Space_Mono']">
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Payments */}
      {existingPayments.length > 0 && (
        <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
            {t('splitPayment.previousContributions', 'Previous Contributions')}
          </h3>
          
          <div className="space-y-2">
            {existingPayments.map((payment, index) => (
              <div key={payment.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                  {t('splitPayment.contribution', 'Contribution {{number}}', { number: index + 1 })}
                </span>
                <span className="text-sm font-bold text-green-600 font-['Space_Mono']">
                  {formatCurrency(payment.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribution Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contributor Information */}
        <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
            {t('splitPayment.contributorInfo', 'Contributor Information')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contributorName" className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('splitPayment.contributorName', 'Full Name')}
              </Label>
              <Input
                id="contributorName"
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder={t('splitPayment.contributorNamePlaceholder', 'Enter your full name')}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="contributorEmail" className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('splitPayment.contributorEmail', 'Email Address')}
              </Label>
              <Input
                id="contributorEmail"
                type="email"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                placeholder={t('splitPayment.contributorEmailPlaceholder', 'Enter your email')}
                className="mt-1"
                required
              />
            </div>
          </div>
        </div>

        {/* Contribution Amount */}
        <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
            {t('splitPayment.contributionAmount', 'Contribution Amount')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contributionAmount" className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('splitPayment.amount', 'Amount')} (USD)
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0A0A0A] font-['Space_Mono']">
                  $
                </span>
                <Input
                  id="contributionAmount"
                  type="text"
                  value={contributionAmount}
                  onChange={(e) => handleContributionAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-[#0A0A0A] opacity-60 font-['Plus_Jakarta_Sans']">
                {t('splitPayment.maxAmount', 'Maximum: {{amount}}', { 
                  amount: formatCurrency(remainingBalance) 
                })}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((percentage) => {
                const amount = Math.round((remainingBalance * percentage) / 100);
                if (amount <= 0) return null;
                
                return (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => setContributionAmount((amount / 100).toFixed(2))}
                    className="px-3 py-1 text-xs font-medium text-[#0A0A0A] bg-white border-[2px] border-[#0A0A0A] rounded-lg hover:bg-[#F5C518] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all duration-200 font-['Plus_Jakarta_Sans']"
                  >
                    {percentage}% ({formatCurrency(amount)})
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setContributionAmount((remainingBalance / 100).toFixed(2))}
                className="px-3 py-1 text-xs font-medium text-[#0A0A0A] bg-white border-[2px] border-[#0A0A0A] rounded-lg hover:bg-[#F5C518] hover:shadow-[2px_2px_0px_#0A0A0A] transition-all duration-200 font-['Plus_Jakarta_Sans']"
              >
                {t('splitPayment.payRemaining', 'Pay Remaining')} ({formatCurrency(remainingBalance)})
              </button>
            </div>
          </div>
        </div>

        {/* Payment Element */}
        {getContributionAmountCents() > 0 && (
          <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
            <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
              {t('splitPayment.paymentMethod', 'Payment Method')}
            </h3>
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
            />
          </div>
        )}

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
          disabled={!stripe || isProcessing || getContributionAmountCents() <= 0}
          className="w-full"
          size="lg"
        >
          {isProcessing 
            ? t('payment.processing', 'Processing...') 
            : t('splitPayment.contributeAmount', 'Contribute {{amount}}', {
                amount: formatCurrency(getContributionAmountCents())
              })}
        </Button>

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
            <div className="size-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
            <span>{t('payment.processingMessage', 'Securely processing your payment...')}</span>
          </div>
        )}
      </form>

      {/* Split Payment Info */}
      <div className="p-4 bg-blue-50 border-[2px] border-[#0A0A0A] rounded-xl">
        <h4 className="text-sm font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans'] mb-2">
          {t('splitPayment.howItWorks', 'How Split Payments Work')}
        </h4>
        <ul className="text-xs text-[#0A0A0A] space-y-1 font-['Plus_Jakarta_Sans']">
          <li>• {t('splitPayment.info1', 'Multiple people can contribute to this trip payment')}</li>
          <li>• {t('splitPayment.info2', 'Each contribution is processed separately and securely')}</li>
          <li>• {t('splitPayment.info3', 'The trip is approved once the full amount is paid')}</li>
          <li>• {t('splitPayment.info4', 'All contributors will receive payment confirmations')}</li>
        </ul>
      </div>
    </div>
  );
}

export function SplitPaymentForm(props: SplitPaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <SplitPaymentFormInner {...props} />
    </Elements>
  );
}