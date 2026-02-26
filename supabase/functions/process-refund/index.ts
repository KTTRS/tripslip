import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { paymentId, amountCents, reason } = await req.json()

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, permission_slips(*, trips(*))')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error('Payment not found')
    }

    if (!payment.stripe_charge_id) {
      throw new Error('No charge ID found for this payment')
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      charge: payment.stripe_charge_id,
      amount: amountCents || payment.amount_cents,
      reason: reason || 'requested_by_customer',
      metadata: {
        payment_id: paymentId,
        permission_slip_id: payment.permission_slip_id
      }
    })

    // Create refund record
    const { data: refundRecord, error: refundError } = await supabase
      .from('refunds')
      .insert({
        payment_id: paymentId,
        amount_cents: refund.amount,
        stripe_refund_id: refund.id,
        reason: reason,
        status: 'processing',
        processed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (refundError) {
      throw refundError
    }

    // Send notification
    if (payment.parent_id) {
      await supabase.rpc('create_notification', {
        p_user_id: payment.parent_id,
        p_user_type: 'parent',
        p_channel: 'email',
        p_subject: 'Refund Processed',
        p_body: `A refund of $${(refund.amount / 100).toFixed(2)} has been processed.`,
        p_is_critical: false,
        p_metadata: { refund_id: refundRecord.id }
      })
    }

    return new Response(
      JSON.stringify({
        refund: refundRecord,
        stripeRefundId: refund.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
