import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/AuthContext'

export interface RevenueTrendData {
  month: string
  revenue: number
  bookings: number
}

export function useRevenueTrend() {
  const [trendData, setTrendData] = useState<RevenueTrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { venueId, venueLoading } = useVenue()

  useEffect(() => {
    if (venueLoading) return
    if (!venueId) {
      setTrendData([])
      setLoading(false)
      return
    }
    fetchTrendData()
  }, [venueId, venueLoading])

  async function fetchTrendData() {
    try {
      setLoading(true)
      setError(null)

      const months: RevenueTrendData[] = []
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select(`
            id,
            trip_date,
            experience:experiences!inner(venue_id),
            permission_slips(
              payments(
                amount_cents,
                status
              )
            )
          `)
          .eq('experience.venue_id', venueId!)
          .gte('trip_date', start.toISOString().split('T')[0])
          .lte('trip_date', end.toISOString().split('T')[0])

        if (tripsError) throw tripsError

        const revenue = trips?.reduce((sum: number, trip: any) => {
          const payments = trip.permission_slips?.flatMap((slip: any) => slip.payments || []) || []
          return sum + payments
            .filter((p: any) => p.status === 'succeeded')
            .reduce((pSum: number, p: any) => pSum + p.amount_cents, 0)
        }, 0) || 0

        months.push({
          month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: revenue / 100,
          bookings: trips?.length || 0
        })
      }

      setTrendData(months)
    } catch (err) {
      console.error('Error fetching revenue trend:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch revenue trend')
    } finally {
      setLoading(false)
    }
  }

  return { trendData, loading, error, refetch: fetchTrendData }
}
