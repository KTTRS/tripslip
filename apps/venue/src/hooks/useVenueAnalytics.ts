import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/AuthContext'

export interface VenueAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  yearlyRevenue: number
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  completedBookings: number
  topExperiences: Array<{
    id: string
    title: string
    revenue: number
    bookingCount: number
  }>
  averageBookingValue: number
  averageStudentCount: number
}

export interface DateRange {
  start: Date
  end: Date
}

export function useVenueAnalytics(dateRange?: DateRange, experienceId?: string) {
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { venueId, venueLoading } = useVenue()

  useEffect(() => {
    if (venueLoading) return
    if (!venueId) {
      setAnalytics(null)
      setLoading(false)
      return
    }
    fetchAnalytics()
  }, [venueId, venueLoading, dateRange, experienceId])

  async function fetchAnalytics() {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          student_count,
          status,
          experience:experiences!inner(
            id,
            title,
            venue_id
          ),
          permission_slips(
            id,
            status,
            payments(
              id,
              amount_cents,
              status,
              created_at
            )
          )
        `)
        .eq('experiences.venue_id', venueId!)

      if (dateRange) {
        query = query
          .gte('trip_date', dateRange.start.toISOString().split('T')[0])
          .lte('trip_date', dateRange.end.toISOString().split('T')[0])
      }

      if (experienceId) {
        query = query.eq('experience_id', experienceId)
      }

      const { data: trips, error: tripsError } = await query

      if (tripsError) throw tripsError

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const yearStart = new Date(now.getFullYear(), 0, 1)

      let totalRevenue = 0
      let monthlyRevenue = 0
      let yearlyRevenue = 0
      let totalBookings = trips?.length || 0
      let confirmedBookings = 0
      let pendingBookings = 0
      let completedBookings = 0
      let totalStudents = 0

      const experienceMap = new Map<string, {
        id: string
        title: string
        revenue: number
        bookingCount: number
      }>()

      trips?.forEach(trip => {
        if (trip.status === 'confirmed') confirmedBookings++
        if (trip.status === 'pending') pendingBookings++
        if (trip.status === 'completed') completedBookings++

        totalStudents += trip.student_count

        const payments = trip.permission_slips?.flatMap((slip: any) => slip.payments || []) || []
        const tripRevenue = payments
          .filter((p: any) => p.status === 'succeeded')
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0)

        totalRevenue += tripRevenue

        const tripDate = new Date(trip.trip_date)
        if (tripDate >= monthStart) {
          monthlyRevenue += tripRevenue
        }
        if (tripDate >= yearStart) {
          yearlyRevenue += tripRevenue
        }

        const exp = (trip as any).experience
        const expId = exp.id
        const expTitle = exp.title
        if (!experienceMap.has(expId)) {
          experienceMap.set(expId, { id: expId, title: expTitle, revenue: 0, bookingCount: 0 })
        }
        const entry = experienceMap.get(expId)!
        entry.revenue += tripRevenue
        entry.bookingCount++
      })

      const topExperiences = Array.from(experienceMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
      const averageStudentCount = totalBookings > 0 ? totalStudents / totalBookings : 0

      setAnalytics({
        totalRevenue, monthlyRevenue, yearlyRevenue,
        totalBookings, confirmedBookings, pendingBookings, completedBookings,
        topExperiences, averageBookingValue, averageStudentCount
      })
    } catch (err) {
      console.error('Error fetching venue analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  return { analytics, loading, error, refetch: fetchAnalytics }
}
