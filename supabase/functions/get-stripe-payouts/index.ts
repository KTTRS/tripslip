import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { venueId, stripeAccountId } = await req.json()

    if (!venueId || !stripeAccountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this venue
    const { data: venueUser, error: venueUserError } = await supabaseClient
      .from('venue_users')
      .select('venue_id')
      .eq('user_id', user.id)
      .eq('venue_id', venueId)
      .single()

    if (venueUserError || !venueUser) {
      return new Response(
        JSON.stringify({ error: 'Access denied to venue' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the Stripe account belongs to this venue
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('stripe_account_id')
      .eq('id', venueId)
      .single()

    if (venueError || !venue || venue.stripe_account_id !== stripeAccountId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Stripe account for venue' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Get balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    })

    // Get payouts (last 10)
    const payouts = await stripe.payouts.list(
      {
        limit: 10,
      },
      {
        stripeAccount: stripeAccountId,
      }
    )

    // Transform balance data
    const balanceData = {
      available: balance.available.reduce((sum, b) => sum + b.amount, 0),
      pending: balance.pending.reduce((sum, b) => sum + b.amount, 0),
    }

    // Transform payout data
    const payoutData = payouts.data.map(payout => ({
      id: payout.id,
      amount: payout.amount,
      arrival_date: payout.arrival_date,
      status: payout.status,
      description: payout.description,
      created: payout.created,
    }))

    return new Response(
      JSON.stringify({
        balance: balanceData,
        payouts: payoutData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error retrieving Stripe payouts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})