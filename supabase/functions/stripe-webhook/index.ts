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

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  // Create Supabase client with service role for webhook operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  let event: Stripe.Event | null = null

  try {
    // Verify webhook signature
    if (!signature) {
      throw new Error('Missing stripe-signature header')
    }

    if (!Deno.env.get('STRIPE_WEBHOOK_SECRET')) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    
    // Log signature verification failure
    if (event) {
      await logWebhookEvent(supabase, event, 'error', `Signature verification failed: ${error.message}`)
    }
    
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${error.message}` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }

  try {
    // Handle different event types
    let handled = false
    let errorMessage: string | null = null

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabase)
          handled = true
          break
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabase)
          handled = true
          break
        case 'refund.created':
          await handleRefundCreated(event.data.object as Stripe.Refund, supabase)
          handled = true
          break
        case 'charge.refunded':
          // Handle charge refund events
          console.log('Charge refunded event received')
          handled = true
          break
        case 'payment_intent.created':
        case 'payment_intent.processing':
        case 'charge.succeeded':
          // These are informational events we acknowledge but don't need to process
          handled = true
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
          handled = false
      }
    } catch (handlerError) {
      errorMessage = handlerError.message
      console.error(`Error handling ${event.type}:`, handlerError)
      
      // Log the error but still log the event
      await logWebhookEvent(supabase, event, 'error', errorMessage)
      
      // Re-throw to return error response
      throw handlerError
    }

    // Log the webhook event
    await logWebhookEvent(
      supabase, 
      event, 
      handled ? 'handled' : 'unhandled',
      errorMessage
    )

    // Alert on critical unhandled events
    if (!handled && isCriticalEventType(event.type)) {
      await alertUnhandledEvent(event, supabase)
    }

    return new Response(
      JSON.stringify({ received: true, handled }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // Validate required metadata fields
  const validationResult = validatePaymentMetadata(paymentIntent.metadata)
  if (!validationResult.isValid) {
    console.error('Payment metadata validation failed:', validationResult.errors)
    
    // Log metadata validation failure for monitoring
    await logMetadataValidationFailure(supabase, paymentIntent.id, validationResult.errors)
    
    // Still process if we have minimum required data
    if (!paymentIntent.metadata.permission_slip_id) {
      throw new Error(`Critical metadata missing: ${validationResult.errors.join(', ')}`)
    }
  }

  const { permission_slip_id, parent_id } = paymentIntent.metadata

  // Update payment status to succeeded
  const { error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge,
      paid_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (paymentUpdateError) {
    console.error('Error updating payment status:', paymentUpdateError)
    throw paymentUpdateError
  }

  // Check if all payments for this slip are complete
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('status, amount_cents')
    .eq('permission_slip_id', permission_slip_id)

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError)
    throw paymentsError
  }

  const allPaid = payments?.every((p: any) => p.status === 'succeeded')

  if (allPaid) {
    // Update permission slip status to paid
    const { error: slipUpdateError } = await supabase
      .from('permission_slips')
      .update({ status: 'paid' })
      .eq('id', permission_slip_id)

    if (slipUpdateError) {
      console.error('Error updating slip status:', slipUpdateError)
      throw slipUpdateError
    }

    // Fetch permission slip details for notification
    const { data: slip, error: slipError } = await supabase
      .from('permission_slips')
      .select(`
        id,
        signed_by_parent_id,
        students (
          id,
          first_name,
          last_name
        ),
        trips (
          id,
          title,
          trip_date,
          experiences (
            title
          )
        )
      `)
      .eq('id', permission_slip_id)
      .single()

    if (slipError || !slip) {
      console.error('Error fetching slip details for notification:', slipError)
      return
    }

    // Calculate total amount paid
    const totalAmount = payments?.reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0
    const formattedAmount = `$${(totalAmount / 100).toFixed(2)}`

    // Trigger payment confirmation notification
    if (parent_id) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            userId: parent_id,
            userType: 'parent',
            channel: 'email',
            templateName: 'payment_confirmed',
            language: 'en',
            data: {
              parentName: 'Parent',
              studentName: `${slip.students?.first_name} ${slip.students?.last_name}`,
              tripTitle: slip.trips?.experiences?.title || slip.trips?.title || 'Field Trip',
              amount: formattedAmount,
              receiptUrl: `${Deno.env.get('PARENT_APP_URL')}/receipts/${permission_slip_id}`
            },
            isCritical: false
          })
        })
      } catch (notificationError) {
        // Log but don't fail the webhook if notification fails
        console.error('Error sending notification:', notificationError)
      }
    }
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  const { permission_slip_id } = paymentIntent.metadata

  if (!permission_slip_id) {
    console.error('Missing permission_slip_id in payment intent metadata')
    return
  }

  // Update payment status to failed
  const { error: paymentUpdateError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      error_message: paymentIntent.last_payment_error?.message || 'Payment failed'
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (paymentUpdateError) {
    console.error('Error updating payment status:', paymentUpdateError)
    throw paymentUpdateError
  }
}

async function handleRefundCreated(refund: Stripe.Refund, supabase: any) {
  // Get the payment intent ID from the refund
  const paymentIntentId = typeof refund.payment_intent === 'string' 
    ? refund.payment_intent 
    : refund.payment_intent?.id

  if (!paymentIntentId) {
    console.error('Missing payment_intent in refund')
    return
  }

  // Find the payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (paymentError || !payment) {
    console.error('Error finding payment for refund:', paymentError)
    return
  }

  // Create refund record
  const { error: refundError } = await supabase
    .from('refunds')
    .insert({
      payment_id: payment.id,
      amount_cents: refund.amount,
      stripe_refund_id: refund.id,
      reason: refund.reason || 'requested_by_customer',
      status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
      processed_at: refund.status === 'succeeded' ? new Date().toISOString() : null
    })

  if (refundError) {
    console.error('Error creating refund record:', refundError)
    throw refundError
  }

  // If refund is complete, update payment status
  if (refund.status === 'succeeded') {
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', payment.id)

    if (paymentUpdateError) {
      console.error('Error updating payment status to refunded:', paymentUpdateError)
    }
  }
}

/**
 * Log webhook event to database for monitoring and debugging
 */
async function logWebhookEvent(
  supabase: any,
  event: Stripe.Event,
  status: 'handled' | 'unhandled' | 'error',
  errorMessage: string | null = null
) {
  try {
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        status,
        payload: event.data.object,
        error_message: errorMessage,
        processed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging webhook event:', error)
    }
  } catch (error) {
    // Don't fail webhook processing if logging fails
    console.error('Failed to log webhook event:', error)
  }
}

/**
 * Check if an event type is critical and should trigger alerts
 */
function isCriticalEventType(eventType: string): boolean {
  const criticalEvents = [
    'payment_intent.amount_capturable_updated',
    'payment_intent.canceled',
    'charge.dispute.created',
    'charge.dispute.updated',
    'charge.dispute.closed',
    'customer.subscription.deleted',
    'invoice.payment_failed',
    'account.updated',
    'account.application.deauthorized'
  ]
  
  return criticalEvents.includes(eventType)
}

/**
 * Alert on unhandled critical events
 */
async function alertUnhandledEvent(event: Stripe.Event, supabase: any) {
  try {
    console.warn(`ALERT: Unhandled critical event type: ${event.type}`)
    
    // In production, this would send an alert to monitoring service (e.g., Sentry, PagerDuty)
    // For now, we'll log it prominently
    
    // Could also insert into a separate alerts table or send email to admins
    const alertMessage = `Unhandled critical Stripe webhook event: ${event.type}\nEvent ID: ${event.id}\nPlease review and add handler if needed.`
    
    console.error(alertMessage)
    
    // Optionally: Send email to admin
    // await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    //   },
    //   body: JSON.stringify({
    //     to: 'admin@tripslip.com',
    //     subject: 'Unhandled Critical Webhook Event',
    //     body: alertMessage
    //   })
    // })
  } catch (error) {
    console.error('Error sending alert for unhandled event:', error)
  }
}
