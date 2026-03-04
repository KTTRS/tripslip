import type { SupabaseClient } from './client';

/**
 * Refund record from the database
 */
export interface Refund {
  id: string;
  payment_id: string;
  amount_cents: number;
  stripe_refund_id: string | null;
  reason: string | null;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a refund
 */
export interface CreateRefundInput {
  paymentId: string;
  amountCents?: number; // Optional - defaults to full refund
  reason?: string;
}

/**
 * Result of refund initiation
 */
export interface RefundResult {
  refund: Refund;
  stripeRefundId: string;
}

/**
 * Service for managing payment refunds
 * 
 * Handles refund creation through Stripe API and database record management.
 * Supports both full and partial refunds.
 * 
 * @example
 * ```ts
 * const refundService = new RefundService(supabase, stripeSecretKey);
 * 
 * // Full refund
 * const result = await refundService.createRefund({
 *   paymentId: 'payment-uuid'
 * });
 * 
 * // Partial refund
 * const partialResult = await refundService.createRefund({
 *   paymentId: 'payment-uuid',
 *   amountCents: 5000, // $50.00
 *   reason: 'Partial cancellation'
 * });
 * ```
 */
export class RefundService {
  constructor(
    private supabase: SupabaseClient,
    private stripeSecretKey: string
  ) {}

  /**
   * Create a refund for a payment
   * 
   * @param input - Refund creation parameters
   * @returns Refund record and Stripe refund ID
   * @throws Error if payment not found, already refunded, or Stripe API fails
   */
  async createRefund(input: CreateRefundInput): Promise<RefundResult> {
    const { paymentId, amountCents, reason } = input;

    // Fetch payment record
    const { data: payment, error: paymentError } = await this.supabase
      .from('payments')
      .select('id, amount_cents, stripe_payment_intent_id, status')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    // Validate payment status
    if (payment.status !== 'succeeded') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('Payment has no associated Stripe payment intent');
    }

    // Calculate refund amount (default to full refund)
    const refundAmount = amountCents ?? payment.amount_cents;

    // Validate refund amount
    if (refundAmount <= 0) {
      throw new Error('Refund amount must be positive');
    }

    if (refundAmount > payment.amount_cents) {
      throw new Error(`Refund amount (${refundAmount}) exceeds payment amount (${payment.amount_cents})`);
    }

    // Check for existing refunds
    const { data: existingRefunds, error: refundsError } = await this.supabase
      .from('refunds')
      .select('amount_cents, status')
      .eq('payment_id', paymentId)
      .in('status', ['succeeded', 'pending', 'processing']);

    if (refundsError) {
      throw new Error(`Error checking existing refunds: ${refundsError.message}`);
    }

    // Calculate total already refunded
    const totalRefunded = existingRefunds?.reduce(
      (sum, refund) => sum + refund.amount_cents,
      0
    ) || 0;

    const remainingAmount = payment.amount_cents - totalRefunded;

    if (refundAmount > remainingAmount) {
      throw new Error(
        `Refund amount (${refundAmount}) exceeds remaining refundable amount (${remainingAmount})`
      );
    }

    // Create Stripe refund
    let stripeRefund;
    try {
      const stripeResponse = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          payment_intent: payment.stripe_payment_intent_id,
          amount: refundAmount.toString(),
          ...(reason && { reason: 'requested_by_customer' }),
          ...(reason && { 'metadata[reason]': reason }),
        }),
      });

      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.json();
        throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      stripeRefund = await stripeResponse.json();
    } catch (error) {
      throw new Error(`Failed to create Stripe refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create refund record in database
    const { data: refund, error: refundError } = await this.supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        amount_cents: refundAmount,
        stripe_refund_id: stripeRefund.id,
        reason: reason || null,
        status: stripeRefund.status === 'succeeded' ? 'succeeded' : 'pending',
        processed_at: stripeRefund.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (refundError) {
      throw new Error(`Failed to create refund record: ${refundError.message}`);
    }

    // Update payment status if fully refunded
    if (totalRefunded + refundAmount >= payment.amount_cents) {
      const { error: updateError } = await this.supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Failed to update payment status to refunded:', updateError);
        // Don't throw - refund was created successfully
      }
    }

    return {
      refund: refund as Refund,
      stripeRefundId: stripeRefund.id,
    };
  }

  /**
   * Get refund by ID
   * 
   * @param refundId - Refund UUID
   * @returns Refund record or null if not found
   */
  async getRefundById(refundId: string): Promise<Refund | null> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select('*')
      .eq('id', refundId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error fetching refund: ${error.message}`);
    }

    return data as Refund;
  }

  /**
   * Get all refunds for a payment
   * 
   * @param paymentId - Payment UUID
   * @returns Array of refund records
   */
  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching refunds: ${error.message}`);
    }

    return (data as Refund[]) || [];
  }

  /**
   * Get total refunded amount for a payment
   * 
   * @param paymentId - Payment UUID
   * @returns Total amount refunded in cents
   */
  async getTotalRefunded(paymentId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select('amount_cents')
      .eq('payment_id', paymentId)
      .in('status', ['succeeded', 'pending', 'processing']);

    if (error) {
      throw new Error(`Error calculating total refunded: ${error.message}`);
    }

    return data?.reduce((sum, refund) => sum + refund.amount_cents, 0) || 0;
  }
}
