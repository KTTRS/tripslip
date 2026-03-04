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

    const { accountId } = await req.json()

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing account ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this Stripe account
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('id')
      .eq('stripe_account_id', accountId)
      .single()

    if (venueError || !venue) {
      return new Response(
        JSON.stringify({ error: 'Stripe account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this venue
    const { data: venueUser, error: venueUserError } = await supabaseClient
      .from('venue_users')
      .select('venue_id')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .single()

    if (venueUserError || !venueUser) {
      return new Response(
        JSON.stringify({ error: 'Access denied to venue' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(accountId)

    // Update venue status based on account capabilities
    let status = 'pending'
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active'
    } else if (account.details_submitted) {
      status = 'pending'
    } else {
      status = 'incomplete'
    }

    // Update venue status in database
    await supabaseClient
      .from('venues')
      .update({ stripe_account_status: status })
      .eq('id', venue.id)

    return new Response(
      JSON.stringify({
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
        business_profile: account.business_profile,
        country: account.country,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error retrieving Stripe account:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})