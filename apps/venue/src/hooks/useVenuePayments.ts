import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/AuthContext'

export interface PaymentData {
  id: string
  amount_cents: number
  status: string
  payment_method: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  paid_at: string | null
  created_at: string
  permission_slip: {
    id: string
    student: {
      first_name: string
      last_name: string
    }
  }
  trip: {
    id: string
    trip_name: string
    trip_date: string
    school: {
      name: string
    }
  }
}

export interface PaymentSummary {
  totalRevenue: number
  pendingPayments: number
  refundedAmount: number
  successfulPayments: number
  pendingCount: number
  refundedCount: number
}

export interface PaymentFilters {
  startDate?: Date
  endDate?: Date
  status?: string
}

export function useVenuePayments(filters?: PaymentFilters) {
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { venueId, venueLoading } = useVenue()

  useEffect(() => {
    if (venueLoading) return
    if (!venueId) {
      setPayments([])
      setSummary(null)
      setLoading(false)
      return
    }
    fetchPayments()
  }, [venueId, venueLoading, filters])

  async function fetchPayments() {
    try {
      setLoading(true)
      setError(null)

      // Build query for payments
      let query = supabase
        .from('payments')
        .select(`
          id,
          amount_cents,
          status,
          payment_method,
          stripe_payment_intent_id,
          stripe_charge_id,
          paid_at,
          created_at,
          permission_slip:permission_slips!inner(
            id,
            student:students(
              first_name,
              last_name
            ),
            trip:trips!inner(
              id,
              trip_date,
              experience:experiences!inner(
                title,
                venue_id
              ),
              teacher:teachers(
                school:schools(
                  name
                )
              )
            )
          )
        `)
        .eq('permission_slip.trip.experience.venue_id', venueId)
        .order('created_at', { ascending: false })

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString())
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString())
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data: paymentsData, error: paymentsError } = await query

      if (paymentsError) throw paymentsError

      // Transform data to flatten nested structure
      const transformedPayments: PaymentData[] = (paymentsData || []).map(payment => ({
        id: payment.id,
        amount_cents: payment.amount_cents,
        status: payment.status,
        payment_method: payment.payment_method,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        stripe_charge_id: payment.stripe_charge_id,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        permission_slip: {
          id: payment.permission_slip.id,
          student: payment.permission_slip.student
        },
        trip: {
          id: payment.permission_slip.trip.id,
          trip_name: payment.permission_slip.trip.experience?.title || 'Unknown',
          trip_date: payment.permission_slip.trip.trip_date,
          school: {
            name: payment.permission_slip.trip.teacher?.school?.name || 'Unknown'
          }
        }
      }))

      setPayments(transformedPayments)

      // Calculate summary
      const totalRevenue = transformedPayments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount_cents, 0)

      const pendingPayments = transformedPayments
        .filter(p => p.status === 'pending' || p.status === 'processing')
        .reduce((sum, p) => sum + p.amount_cents, 0)

      const successfulPayments = transformedPayments.filter(p => p.status === 'succeeded').length
      const pendingCount = transformedPayments.filter(p => p.status === 'pending' || p.status === 'processing').length

      // Get refunded amount
      const { data: refundsData } = await supabase
        .from('refunds')
        .select(`
          amount_cents,
          status,
          payment:payments!inner(
            permission_slip:permission_slips!inner(
              trip:trips!inner(
                experience:experiences!inner(
                  venue_id
                )
              )
            )
          )
        `)
        .eq('payment.permission_slip.trip.experience.venue_id', venueId)
        .eq('status', 'succeeded')

      const refundedAmount = (refundsData || []).reduce((sum, r) => sum + r.amount_cents, 0)
      const refundedCount = refundsData?.length || 0

      setSummary({
        totalRevenue,
        pendingPayments,
        refundedAmount,
        successfulPayments,
        pendingCount,
        refundedCount
      })
    } catch (err) {
      console.error('Error fetching venue payments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payments')
    } finally {
      setLoading(false)
    }
  }

  return { payments, summary, loading, error, refetch: fetchPayments }
}
