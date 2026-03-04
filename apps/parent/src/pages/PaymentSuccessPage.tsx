import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@tripslip/ui';
import { generateReceipt, downloadReceipt, type ReceiptData } from '@tripslip/utils';
import { supabase } from '../lib/supabase';
import { getPaymentsByPermissionSlip, type Payment } from '../services/payment-service';

interface PermissionSlipData {
  id: string;
  trip_id: string;
  student_id: string;
  status: string;
  total_cost_cents: number;
  created_at: string;
  trip?: {
    name: string;
    date: string;
    venue?: {
      name: string;
    };
  };
  student?: {
    first_name: string;
    last_name: string;
  };
}

/**
 * Payment Confirmation Page
 * 
 * Displays payment confirmation details after successful payment.
 * Follows TripSlip design system with Yellow #F5C518, Black #0A0A0A,
 * Fraunces/Plus Jakarta Sans/Space Mono typography, and offset shadows.
 * 
 * Features:
 * - Payment confirmation with trip details
 * - Receipt download option
 * - Navigation back to permission slip
 * 
 * Requirements: 1.4, 4.5
 */
export function PaymentSuccessPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slipData, setSlipData] = useState<PermissionSlipData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentIntentId = searchParams.get('payment_intent');
      const slipId = searchParams.get('slip_id');

      if (!paymentIntentId && !slipId) {
        setError(t('payment.missingInfo', 'Missing payment information'));
        setLoading(false);
        return;
      }

      try {
        let permissionSlipId = slipId;

        // If we have payment intent ID, find the slip from the payment
        if (paymentIntentId && !slipId) {
          const { data: payment } = await supabase
            .from('payments')
            .select('permission_slip_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

          if (payment) {
            permissionSlipId = payment.permission_slip_id;
          }
        }

        if (!permissionSlipId) {
          throw new Error('Could not find permission slip');
        }

        // Fetch updated permission slip with related data
        const { data: slip, error: slipError } = await supabase
          .from('permission_slips')
          .select(`
            *,
            trip:trips (
              name,
              date,
              venue:venues (
                name
              )
            ),
            student:students (
              first_name,
              last_name
            )
          `)
          .eq('id', permissionSlipId)
          .single();

        if (slipError) throw slipError;

        setSlipData(slip as PermissionSlipData);

        // Fetch all payments for this slip
        const slipPayments = await getPaymentsByPermissionSlip(permissionSlipId);
        setPayments(slipPayments.filter(p => p.status === 'succeeded'));

        // Fetch parent name from the most recent payment
        if (slipPayments.length > 0 && slipPayments[0].parent_name) {
          setParentName(slipPayments[0].parent_name);
        }
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message || t('payment.verifyError', 'Failed to verify payment'));
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, t]);

  const handleDownloadReceipt = () => {
    if (!slipData || payments.length === 0) return;

    try {
      setDownloading(true);

      // Use the most recent payment for receipt
      const latestPayment = payments[payments.length - 1];

      const receiptData: ReceiptData = {
        paymentId: latestPayment.id,
        parentName: parentName || 'Parent',
        studentName: slipData.student 
          ? `${slipData.student.first_name} ${slipData.student.last_name}`
          : 'Student',
        tripTitle: slipData.trip?.name || 'Field Trip',
        venueName: slipData.trip?.venue?.name || 'Venue',
        tripDate: formatDate(slipData.trip?.date || slipData.created_at),
        amountCents: latestPayment.amount_cents,
        paymentDate: formatDate(latestPayment.created_at),
        paymentMethod: latestPayment.payment_method || 'Card',
        currency: 'USD'
      };

      const pdf = generateReceipt(receiptData, i18n.language as 'en' | 'es' | 'ar');
      downloadReceipt(pdf, latestPayment.id);
    } catch (err) {
      console.error('Error generating receipt:', err);
      setReceiptError(t('payment.receiptError', 'Failed to generate receipt. Please try again.'));
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="size-16 border-[3px] border-[#0A0A0A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#0A0A0A] font-['Plus_Jakarta_Sans'] font-medium">
            {t('payment.verifying', 'Verifying payment...')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[8px_8px_0px_#0A0A0A] p-8 text-center">
          <div className="size-20 bg-red-50 border-[2px] border-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="size-10 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0A0A0A] font-['Fraunces'] mb-3">
            {t('payment.failed', 'Payment Failed')}
          </h1>
          <p className="text-[#0A0A0A] font-['Plus_Jakarta_Sans'] mb-8">{error}</p>
          <Button
            onClick={() => navigate(-1)}
            className="w-full"
            size="lg"
          >
            {t('payment.retry', 'Try Again')}
          </Button>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount_cents, 0);
  const isFullyPaid = slipData && totalPaid >= slipData.total_cost_cents;

  return (
    <div className="min-h-screen bg-white p-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="bg-[#F5C518] border-[2px] border-[#0A0A0A] rounded-xl shadow-[8px_8px_0px_#0A0A0A] p-8 mb-6 text-center">
          <div className="size-24 bg-white border-[2px] border-[#0A0A0A] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#0A0A0A]">
            <svg className="size-12 text-[#0A0A0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-[#0A0A0A] font-['Fraunces'] mb-3">
            {t('payment.success', 'Payment Successful!')}
          </h1>
          <p className="text-lg text-[#0A0A0A] font-['Plus_Jakarta_Sans'] font-medium">
            {isFullyPaid 
              ? t('payment.allSet', "You're all set for the trip!")
              : t('payment.partialComplete', 'Partial payment received')}
          </p>
        </div>

        {/* Trip Details */}
        {slipData && (
          <div className="bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[5px_5px_0px_#0A0A0A] p-6 mb-6">
            <h2 className="text-2xl font-bold text-[#0A0A0A] font-['Fraunces'] mb-6">
              {t('payment.tripDetails', 'Trip Details')}
            </h2>
            
            <div className="space-y-4">
              {slipData.trip && (
                <>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                      {t('payment.tripName', 'Trip')}
                    </span>
                    <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans'] text-right">
                      {slipData.trip.name}
                    </span>
                  </div>

                  {slipData.trip.venue && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                        {t('payment.venue', 'Venue')}
                      </span>
                      <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans'] text-right">
                        {slipData.trip.venue.name}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                      {t('payment.date', 'Date')}
                    </span>
                    <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans'] text-right">
                      {formatDate(slipData.trip.date)}
                    </span>
                  </div>
                </>
              )}

              {slipData.student && (
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                    {t('payment.student', 'Student')}
                  </span>
                  <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans'] text-right">
                    {slipData.student.first_name} {slipData.student.last_name}
                  </span>
                </div>
              )}

              <div className="h-px bg-[#0A0A0A] my-4" />

              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                  {t('payment.totalPaid', 'Total Paid')}
                </span>
                <span className="text-2xl font-bold text-[#0A0A0A] font-['Space_Mono']">
                  {formatCurrency(totalPaid)}
                </span>
              </div>

              {!isFullyPaid && slipData.total_cost_cents && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                    {t('payment.remainingBalance', 'Remaining Balance')}
                  </span>
                  <span className="text-lg font-bold text-[#0A0A0A] font-['Space_Mono']">
                    {formatCurrency(slipData.total_cost_cents - totalPaid)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Message */}
        <div className="bg-white border-[2px] border-[#0A0A0A] rounded-xl p-6 mb-6">
          <p className="text-[#0A0A0A] font-['Plus_Jakarta_Sans'] text-center">
            {t('payment.confirmationEmail', 'A confirmation email with your receipt has been sent to your email address.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {receiptError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {receiptError}
            </div>
          )}
          <Button
            onClick={() => { setReceiptError(null); handleDownloadReceipt(); }}
            variant="outline"
            className="w-full"
            size="lg"
            disabled={downloading || !slipData || payments.length === 0}
          >
            {downloading 
              ? t('payment.generatingReceipt', 'Generating Receipt...')
              : t('payment.downloadReceipt', 'Download Receipt')}
          </Button>

          <Button
            onClick={() => navigate(`/slip/${slipData?.id}`)}
            className="w-full"
            size="lg"
          >
            {t('payment.viewSlip', 'View Permission Slip')}
          </Button>
        </div>
      </div>
    </div>
  );
}
