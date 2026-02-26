import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useStripePaymentSync() {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  async function syncPaymentStatus(paymentId: string) {
    try {
      setSyncing(true)
      setError(null)

      if (!user) throw new Error('User not authenticated')

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('stripe_payment_intent_id')
        .eq('id', paymentId)
        .single()

      if (paymentError) throw paymentError
      if (!payment?.stripe_payment_intent_id) {
        throw new Error('Payment does not have a Stripe payment intent')
      }

      // Call Edge Function to sync with Stripe
      const { data: syncData, error: syncError } = await supabase.functions.invoke(
        'sync-payment-status',
        {
          body: {
            paymentId,
            stripePaymentIntentId: payment.stripe_payment_intent_id
          }
        }
      )

      if (syncError) throw syncError

      return syncData
    } catch (err) {
      console.error('Error syncing payment status:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync payment status')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  async function syncAllPayments() {
    try {
      setSyncing(true)
      setError(null)

      if (!user) throw new Error('User not authenticated')

      // Get venue_id for current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user.id)
        .single()

      if (venueError) throw venueError
      if (!venueUser) throw new Error('Venue not found for user')

      // Call Edge Function to sync all payments
      const { data: syncData, error: syncError } = await supabase.functions.invoke(
        'sync-venue-payments',
        {
          body: {
            venueId: venueUser.venue_id
          }
        }
      )

      if (syncError) throw syncError

      return syncData
    } catch (err) {
      console.error('Error syncing all payments:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync payments')
      throw err
    } finally {
      setSyncing(false)
    }
  }

  return { syncPaymentStatus, syncAllPayments, syncing, error }
}
