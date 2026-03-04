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

    const { venueId, returnUrl, refreshUrl } = await req.json()

    if (!venueId || !returnUrl || !refreshUrl) {
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

    // Get venue details
    const { data: venue, error: venueError } = await supabaseClient
      .from('venues')
      .select('name, email, stripe_account_id')
      .eq('id', venueId)
      .single()

    if (venueError || !venue) {
      return new Response(
        JSON.stringify({ error: 'Venue not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    let accountId = venue.stripe_account_id

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // TODO: Make this configurable based on venue location
        email: venue.email,
        business_profile: {
          name: venue.name,
          product_description: 'Educational field trip experiences',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Update venue with Stripe account ID
      const { error: updateError } = await supabaseClient
        .from('venues')
        .update({ 
          stripe_account_id: accountId,
          stripe_account_status: 'pending'
        })
        .eq('id', venueId)

      if (updateError) {
        console.error('Error updating venue with Stripe account ID:', updateError)
        // Continue anyway - the account was created
      }
    }

    // Create account link for onboarding/management
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ url: accountLink.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})