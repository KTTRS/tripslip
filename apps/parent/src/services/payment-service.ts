import { supabase } from '../lib/supabase';

/**
 * Payment service for Parent App
 * Handles payment intent creation and payment retrieval via Supabase Edge Functions
 */

export interface CreatePaymentIntentRequest {
  permissionSlipId: string;
  amountCents: number;
  parentId?: string;
  isSplitPayment?: boolean;
  splitPaymentGroupId?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
}

export interface Payment {
  id: string;
  permission_slip_id: string;
  parent_id: string | null;
  amount_cents: number;
  stripe_payment_intent_id: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  is_split_payment: boolean;
  split_payment_group_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentServiceError {
  message: string;
  code?: string;
}

/**
 * Creates a payment intent for a permission slip
 * 
 * @param request - Payment intent creation parameters
 * @returns Promise with client secret and payment ID
 * @throws Error if payment intent creation fails
 * 
 * @example
 * ```ts
 * const { clientSecret, paymentId } = await createPaymentIntent({
 *   permissionSlipId: 'uuid',
 *   amountCents: 5000,
 *   parentId: 'uuid'
 * });
 * ```
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        permissionSlipId: request.permissionSlipId,
        amountCents: request.amountCents,
        parentId: request.parentId,
        isSplitPayment: request.isSplitPayment,
        splitPaymentGroupId: request.splitPaymentGroupId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create payment intent');
    }

    if (!data || !data.clientSecret) {
      throw new Error('Invalid response from payment service');
    }

    return {
      clientSecret: data.clientSecret,
      paymentId: data.paymentId,
    };
  } catch (err) {
    const error = err as Error;
    throw new Error(
      error.message || 'An unexpected error occurred while creating payment intent'
    );
  }
}

/**
 * Retrieves a payment by ID
 * 
 * @param paymentId - The payment ID to retrieve
 * @returns Promise with payment data
 * @throws Error if payment retrieval fails
 * 
 * @example
 * ```ts
 * const payment = await getPayment('payment-uuid');
 * logger.info('Payment status:', payment.status); // 'succeeded'
 * ```
 */
export async function getPayment(paymentId: string): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to retrieve payment');
    }

    if (!data) {
      throw new Error('Payment not found');
    }

    return data as Payment;
  } catch (err) {
    const error = err as Error;
    throw new Error(
      error.message || 'An unexpected error occurred while retrieving payment'
    );
  }
}

/**
 * Retrieves all payments for a permission slip
 * 
 * @param permissionSlipId - The permission slip ID
 * @returns Promise with array of payments
 * @throws Error if retrieval fails
 * 
 * @example
 * ```ts
 * const payments = await getPaymentsByPermissionSlip('slip-uuid');
 * const total = payments.reduce((sum, p) => sum + p.amount_cents, 0);
 * ```
 */
export async function getPaymentsByPermissionSlip(
  permissionSlipId: string
): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('permission_slip_id', permissionSlipId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message || 'Failed to retrieve payments');
    }

    return (data || []) as Payment[];
  } catch (err) {
    const error = err as Error;
    throw new Error(
      error.message || 'An unexpected error occurred while retrieving payments'
    );
  }
}

/**
 * Retrieves payment by Stripe payment intent ID
 * 
 * @param stripePaymentIntentId - The Stripe payment intent ID
 * @returns Promise with payment data
 * @throws Error if payment retrieval fails
 * 
 * @example
 * ```ts
 * const payment = await getPaymentByStripeId('pi_xxx');
 * ```
 */
export async function getPaymentByStripeId(
  stripePaymentIntentId: string
): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', stripePaymentIntentId)
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to retrieve payment');
    }

    if (!data) {
      throw new Error('Payment not found');
    }

    return data as Payment;
  } catch (err) {
    const error = err as Error;
    throw new Error(
      error.message || 'An unexpected error occurred while retrieving payment'
    );
  }
}
