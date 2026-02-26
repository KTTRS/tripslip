import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface RefundData {
  id: string
  amount_cents: number
  status: string
  reason: string | null
  stripe_refund_id: string | null
  processed_at: string | null
  created_at: string
  payment: {
    id: string
    stripe_payment_intent_id: string | null
    permission_slip: {
      student: {
        first_name: string
        last_name: string
      }
    }
    trip: {
      trip_name: string
      trip_date: string
    }
  }
}

export function useVenueRefunds() {
  const [refunds, setRefunds] = useState<RefundData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchRefunds()
  }, [user])

  async function fetchRefunds() {
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

      const venueId = venueUser.venue_id

      // Fetch refunds
      const { data: refundsData, error: refundsError } = await supabase
        .from('refunds')
        .select(`
          id,
          amount_cents,
          status,
          reason,
          stripe_refund_id,
          processed_at,
          created_at,
          payment:payments!inner(
            id,
            stripe_payment_intent_id,
            permission_slip:permission_slips!inner(
              student:students(
                first_name,
                last_name
              ),
              trip:trips!inner(
                trip_date,
                experience:experiences!inner(
                  title,
                  venue_id
                )
              )
            )
          )
        `)
        .eq('payment.permission_slip.trip.experience.venue_id', venueId)
        .order('created_at', { ascending: false })

      if (refundsError) throw refundsError

      // Transform data
      const transformedRefunds: RefundData[] = (refundsData || []).map(refund => ({
        id: refund.id,
        amount_cents: refund.amount_cents,
        status: refund.status,
        reason: refund.reason,
        stripe_refund_id: refund.stripe_refund_id,
        processed_at: refund.processed_at,
        created_at: refund.created_at,
        payment: {
          id: refund.payment.id,
          stripe_payment_intent_id: refund.payment.stripe_payment_intent_id,
          permission_slip: {
            student: refund.payment.permission_slip.student
          },
          trip: {
            trip_name: refund.payment.permission_slip.trip.experience?.title || 'Unknown',
            trip_date: refund.payment.permission_slip.trip.trip_date
          }
        }
      }))

      setRefunds(transformedRefunds)
    } catch (err) {
      console.error('Error fetching venue refunds:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch refunds')
    } finally {
      setLoading(false)
    }
  }

  return { refunds, loading, error, refetch: fetchRefunds }
}
