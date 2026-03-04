import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@tripslip/ui';
import { generateReceipt, downloadReceipt, type ReceiptData } from '@tripslip/utils';
import { getPaymentsByPermissionSlip, type Payment } from '../services/payment-service';
import { supabase } from '../lib/supabase';

interface PaymentHistoryProps {
  permissionSlipId: string;
  totalCostCents?: number;
}

/**
 * Payment History Component
 * 
 * Displays all payments for a permission slip with status and dates.
 * Follows TripSlip design system with Yellow #F5C518, Black #0A0A0A,
 * Fraunces/Plus Jakarta Sans/Space Mono typography, and offset shadows.
 * 
 * Features:
 * - List of all payments with status
 * - Payment dates and amounts
 * - Total paid and remaining balance
 * - Receipt download for each payment
 * 
 * Requirements: 1.10, 4.9, 4.10
 */
export function PaymentHistory({ permissionSlipId, totalCostCents }: PaymentHistoryProps) {
  const { t, i18n } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [slipData, setSlipData] = useState<any>(null);

  useEffect(() => {
    loadPayments();
    loadSlipData();
  }, [permissionSlipId]);

  const loadSlipData = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setSlipData(data);
    } catch (err) {
      console.error('Failed to load slip data:', err);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const paymentData = await getPaymentsByPermissionSlip(permissionSlipId);
      setPayments(paymentData);
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    if (!slipData) {
      alert(t('payment.receiptError', 'Unable to generate receipt. Please try again.'));
      return;
    }

    try {
      setDownloadingId(paymentId);

      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      const receiptData: ReceiptData = {
        paymentId: payment.id,
        parentName: payment.parent_name || 'Parent',
        studentName: slipData.student 
          ? `${slipData.student.first_name} ${slipData.student.last_name}`
          : 'Student',
        tripTitle: slipData.trip?.name || 'Field Trip',
        venueName: slipData.trip?.venue?.name || 'Venue',
        tripDate: formatDate(slipData.trip?.date || slipData.created_at),
        amountCents: payment.amount_cents,
        paymentDate: formatDate(payment.created_at),
        paymentMethod: payment.payment_method || 'Card',
        currency: 'USD'
      };

      const pdf = generateReceipt(receiptData, i18n.language as 'en' | 'es' | 'ar');
      downloadReceipt(pdf, payment.id);
    } catch (err) {
      console.error('Error generating receipt:', err);
      alert(t('payment.receiptError', 'Failed to generate receipt. Please try again.'));
    } finally {
      setDownloadingId(null);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-50 text-green-700 border-green-700';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-700';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-700';
      case 'canceled':
        return 'bg-gray-50 text-gray-700 border-gray-700';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'succeeded':
        return t('payment.status.succeeded', 'Paid');
      case 'pending':
        return t('payment.status.pending', 'Pending');
      case 'failed':
        return t('payment.status.failed', 'Failed');
      case 'canceled':
        return t('payment.status.canceled', 'Canceled');
      default:
        return status;
    }
  };

  // Calculate totals
  const succeededPayments = payments.filter(p => p.status === 'succeeded');
  const totalPaid = succeededPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const remainingBalance = totalCostCents ? totalCostCents - totalPaid : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="size-8 border-[2.5px] border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-[2px] border-[#0A0A0A] rounded-xl">
        <p className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
          {error}
        </p>
        <Button
          onClick={loadPayments}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          {t('payment.retry', 'Try Again')}
        </Button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="p-8 bg-white border-[2px] border-[#0A0A0A] rounded-xl text-center">
        <p className="text-[#0A0A0A] font-['Plus_Jakarta_Sans'] font-medium">
          {t('payment.noHistory', 'No payment history yet')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      {totalCostCents !== undefined && (
        <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[5px_5px_0px_#0A0A0A]">
          <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
            {t('payment.summary', 'Payment Summary')}
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('payment.totalCost', 'Total Cost')}
              </span>
              <span className="text-xl font-bold text-[#0A0A0A] font-['Space_Mono']">
                {formatCurrency(totalCostCents)}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                {t('payment.totalPaid', 'Total Paid')}
              </span>
              <span className="text-xl font-bold text-green-600 font-['Space_Mono']">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            
            {remainingBalance > 0 && (
              <>
                <div className="h-px bg-[#0A0A0A] my-2" />
                
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                    {t('payment.remainingBalance', 'Remaining Balance')}
                  </span>
                  <span className="text-2xl font-bold text-[#0A0A0A] font-['Space_Mono']">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </>
            )}

            {remainingBalance === 0 && totalPaid > 0 && (
              <div className="mt-4 p-4 bg-[#F5C518] border-[2px] border-[#0A0A0A] rounded-lg">
                <p className="text-sm font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                  ✓ {t('payment.fullyPaid', 'Fully Paid')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment History List */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl">
        <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
          {t('payment.history', 'Payment History')}
        </h3>
        
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 bg-[#F4F4F4] border-[2px] border-[#0A0A0A] rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-[#0A0A0A] font-['Space_Mono']">
                      {formatCurrency(payment.amount_cents)}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-bold border-[2px] rounded-md font-['Plus_Jakarta_Sans'] ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 font-['Plus_Jakarta_Sans']">
                    {formatDate(payment.created_at)}
                  </p>

                  {payment.is_split_payment && (
                    <p className="text-xs text-gray-600 font-['Plus_Jakarta_Sans'] mt-1">
                      {t('payment.splitPayment', 'Split Payment')}
                    </p>
                  )}
                </div>

                {payment.status === 'succeeded' && (
                  <Button
                    onClick={() => handleDownloadReceipt(payment.id)}
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === payment.id}
                  >
                    {downloadingId === payment.id
                      ? t('payment.generating', 'Generating...')
                      : t('payment.receipt', 'Receipt')}
                  </Button>
                )}
              </div>

              {payment.stripe_payment_intent_id && (
                <p className="text-xs text-gray-500 font-['Space_Mono'] truncate">
                  ID: {payment.stripe_payment_intent_id}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="p-4 bg-white border-[2px] border-[#0A0A0A] rounded-xl">
        <p className="text-xs text-gray-600 font-['Plus_Jakarta_Sans'] text-center">
          {t('payment.historyNote', 'All payments are securely processed through Stripe. Receipts are sent to your email.')}
        </p>
      </div>
    </div>
  );
}
