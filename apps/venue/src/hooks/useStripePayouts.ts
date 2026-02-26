import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface PayoutData {
  id: string
  amount: number
  arrival_date: number
  status: string
  description: string | null
  created: number
}

export interface StripeBalance {
  available: number
  pending: number
}

export function useStripePayouts() {
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [balance, setBalance] = useState<StripeBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchStripeData()
  }, [user])

  async function fetchStripeData() {
    try {
      setLoading(true)
      setError(null)

      // Get venue_id for current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single()

      if (venueError) throw venueError
      if (!venueUser) throw new Error('Venue not found for user')

      // Get venue's Stripe Connect account ID
      // TODO: Stripe Connect integration - venues table needs stripe_account_id column
      // For now, return empty data
      setPayouts([])
      setBalance({ available: 0, pending: 0 })
      setLoading(false)
      return

      /* Commented out until stripe_account_id is added to venues table
      if (!venue?.stripe_account_id) {
        // No Stripe account connected yet
        setPayouts([])
        setBalance({ available: 0, pending: 0 })
        setLoading(false)
        return
      }

      // Call Edge Function to fetch Stripe data
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
        'get-stripe-payouts',
        {
          body: {
            venueId: venueUser.venue_id,
            stripeAccountId: venue.stripe_account_id
          }
        }
      )

      if (stripeError) throw stripeError

      setPayouts(stripeData.payouts || [])
      setBalance(stripeData.balance || { available: 0, pending: 0 })
      */
    } catch (err) {
      console.error('Error fetching Stripe data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch Stripe data')
      // Set empty data on error
      setPayouts([])
      setBalance({ available: 0, pending: 0 })
    } finally {
      setLoading(false)
    }
  }

  return { payouts, balance, loading, error, refetch: fetchStripeData }
}
