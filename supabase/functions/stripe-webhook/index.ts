import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
      undefined,
      cryptoProvider
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            stripe_charge_id: paymentIntent.latest_charge as string,
            stripe_fee_cents: paymentIntent.charges?.data[0]?.balance_transaction 
              ? (await stripe.balanceTransactions.retrieve(
                  paymentIntent.charges.data[0].balance_transaction as string
                )).fee
              : null,
            paid_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (paymentError) throw paymentError

        // Get payment to check if split payment is complete
        const { data: payment } = await supabase
          .from('payments')
          .select('*, permission_slips(*)')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          // Check if all split payments are complete
          if (payment.is_split_payment && payment.split_payment_group_id) {
            const { data: allPayments } = await supabase
              .from('payments')
              .select('amount_cents, status')
              .eq('split_payment_group_id', payment.split_payment_group_id)

            const totalPaid = allPayments
              ?.filter(p => p.status === 'succeeded')
              .reduce((sum, p) => sum + p.amount_cents, 0) || 0

            // If total paid equals or exceeds the required amount, mark slip as paid
            const requiredAmount = payment.permission_slips?.form_data?.amount || 0
            if (totalPaid >= requiredAmount) {
              await supabase
                .from('permission_slips')
                .update({ status: 'paid' })
                .eq('id', payment.permission_slip_id)
            }
          } else {
            // Single payment - mark slip as paid
            await supabase
              .from('permission_slips')
              .update({ status: 'paid' })
              .eq('id', payment.permission_slip_id)
          }

          // Create notification
          await supabase.rpc('create_notification', {
            p_user_id: payment.parent_id,
            p_user_type: 'parent',
            p_channel: 'email',
            p_subject: 'Payment Confirmed',
            p_body: 'Your payment has been successfully processed.',
            p_is_critical: false,
            p_metadata: { payment_id: payment.id }
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            error_message: paymentIntent.last_payment_error?.message || 'Payment failed'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        
        // Create refund record
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_charge_id', charge.id)
          .single()

        if (payment) {
          await supabase
            .from('refunds')
            .insert({
              payment_id: payment.id,
              amount_cents: charge.amount_refunded,
              stripe_refund_id: charge.refunds?.data[0]?.id,
              status: 'succeeded',
              processed_at: new Date().toISOString()
            })

          // Update payment status
          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('id', payment.id)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
