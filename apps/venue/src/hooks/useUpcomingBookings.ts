import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useVenue } from '../contexts/AuthContext'

export interface UpcomingBooking {
  id: string
  tripDate: string
  tripTime: string | null
  studentCount: number
  status: string
  experience: {
    id: string
    title: string
  }
  teacher: {
    firstName: string
    lastName: string
  }
  school: {
    name: string
  } | null
}

export function useUpcomingBookings(limit: number = 10) {
  const [bookings, setBookings] = useState<UpcomingBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { venueId, venueLoading } = useVenue()

  useEffect(() => {
    if (venueLoading) return
    if (!venueId) {
      setBookings([])
      setLoading(false)
      return
    }
    fetchUpcomingBookings()
  }, [venueId, venueLoading, limit])

  async function fetchUpcomingBookings() {
    try {
      setLoading(true)
      setError(null)

      const today = new Date().toISOString().split('T')[0]
      
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          student_count,
          status,
          experience:experiences!inner(
            id,
            title,
            venue_id
          ),
          teacher:teachers(
            first_name,
            last_name,
            school:schools(
              name
            )
          )
        `)
        .eq('experiences.venue_id', venueId!)
        .gte('trip_date', today)
        .order('trip_date', { ascending: true })
        .order('trip_time', { ascending: true })
        .limit(limit)

      if (tripsError) throw tripsError

      const formattedBookings: UpcomingBooking[] = trips?.map((trip: any) => ({
        id: trip.id,
        tripDate: trip.trip_date,
        tripTime: trip.trip_time,
        studentCount: trip.student_count,
        status: trip.status,
        experience: {
          id: trip.experience.id,
          title: trip.experience.title
        },
        teacher: {
          firstName: trip.teacher?.first_name || 'Unknown',
          lastName: trip.teacher?.last_name || 'Teacher'
        },
        school: trip.teacher?.school ? {
          name: trip.teacher.school.name
        } : null
      })) || []

      setBookings(formattedBookings)
    } catch (err) {
      console.error('Error fetching upcoming bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming bookings')
    } finally {
      setLoading(false)
    }
  }

  return { bookings, loading, error, refetch: fetchUpcomingBookings }
}
