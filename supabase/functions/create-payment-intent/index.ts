import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { validateUUID, validateAmount } from '../_shared/security.ts'

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { permissionSlipId, parentId, amountCents, isSplitPayment, splitPaymentGroupId } = await req.json()

    // Validate required inputs
    if (!permissionSlipId || !validateUUID(permissionSlipId)) {
      throw new Error('Invalid permission slip ID')
    }

    if (!validateAmount(amountCents)) {
      throw new Error('Invalid amount. Must be a positive integer in cents')
    }

    if (parentId && !validateUUID(parentId)) {
      throw new Error('Invalid parent ID')
    }

    if (splitPaymentGroupId && !validateUUID(splitPaymentGroupId)) {
      throw new Error('Invalid split payment group ID')
    }

    // Validate permission slip exists
    const { data: slip, error: slipError } = await supabase
      .from('permission_slips')
      .select('*, trips(*, experiences(title, currency))')
      .eq('id', permissionSlipId)
      .single()

    if (slipError || !slip) {
      throw new Error('Permission slip not found')
    }

    // Get currency from experience, default to 'usd'
    const currency = slip.trips?.experiences?.currency || 'usd'

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      metadata: {
        permission_slip_id: permissionSlipId,
        parent_id: parentId || '',
        is_split_payment: isSplitPayment ? 'true' : 'false',
        split_payment_group_id: splitPaymentGroupId || '',
        trip_title: slip.trips?.experiences?.title || 'Field Trip'
      },
      automatic_payment_methods: {
        enabled: true
      }
    })

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        permission_slip_id: permissionSlipId,
        parent_id: parentId,
        amount_cents: amountCents,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending',
        is_split_payment: isSplitPayment || false,
        split_payment_group_id: splitPaymentGroupId
      })
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id
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
