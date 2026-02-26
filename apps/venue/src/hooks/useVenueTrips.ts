import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface VenueTrip {
  id: string
  trip_date: string
  trip_time: string | null
  student_count: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  notes?: string
  experience: {
    id: string
    title: string
    venue_id: string
  }
  teacher: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    school: {
      id: string
      name: string
    } | null
  }
}

interface UseVenueTripsOptions {
  status?: string
  experienceId?: string
  startDate?: string
  endDate?: string
}

export function useVenueTrips(options: UseVenueTripsOptions = {}) {
  const [trips, setTrips] = useState<VenueTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetchTrips()
  }, [user, options.status, options.experienceId, options.startDate, options.endDate])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      setError(null)

      // First get the venue_id for the current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single()

      if (venueError) throw venueError
      if (!venueUser) throw new Error('Venue not found for user')

      // Build query for trips
      let query = supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          trip_time,
          student_count,
          status,
          created_at,
          experience:experiences!inner (
            id,
            title,
            venue_id
          ),
          teacher:teachers (
            id,
            first_name,
            last_name,
            email,
            phone,
            school:schools (
              id,
              name
            )
          )
        `)
        .eq('experiences.venue_id', venueUser.venue_id)
        .order('trip_date', { ascending: true })

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status)
      }

      if (options.experienceId) {
        query = query.eq('experience_id', options.experienceId)
      }

      if (options.startDate) {
        query = query.gte('trip_date', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('trip_date', options.endDate)
      }

      const { data, error: tripsError } = await query

      if (tripsError) throw tripsError

      setTrips(data as VenueTrip[])
    } catch (err) {
      console.error('Error fetching trips:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch trips')
    } finally {
      setLoading(false)
    }
  }

  const confirmTrip = async (tripId: string) => {
    try {
      // Get the trip details first
      const trip = trips.find(t => t.id === tripId)
      if (!trip) throw new Error('Trip not found')

      // Check for double-booking on the same date/time
      const { data: existingTrips, error: checkError } = await supabase
        .from('trips')
        .select('id, trip_date, trip_time, experience_id')
        .eq('experience_id', trip.experience.id)
        .eq('trip_date', trip.trip_date)
        .eq('status', 'confirmed')

      if (checkError) throw checkError

      // Check if there's already a confirmed trip at the same time
      if (existingTrips && existingTrips.length > 0) {
        const sameTimeTrip = existingTrips.find(t => t.trip_time === trip.trip_time)
        if (sameTimeTrip) {
          return { 
            success: false, 
            error: 'This time slot is already booked. Please decline this booking or contact the teacher to reschedule.' 
          }
        }
      }

      const { error } = await supabase
        .from('trips')
        .update({ status: 'confirmed' })
        .eq('id', tripId)

      if (error) throw error

      // Refresh trips
      await fetchTrips()

      // Send confirmation email via Edge Function
      try {
        await supabase.functions.invoke('send-notification', {
          body: { 
            type: 'trip_confirmed', 
            tripId,
            teacherEmail: trip.teacher.email,
            teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}`,
            experienceTitle: trip.experience.title,
            tripDate: trip.trip_date,
            tripTime: trip.trip_time
          }
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        // Don't fail the confirmation if email fails
      }

      return { success: true }
    } catch (err) {
      console.error('Error confirming trip:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to confirm trip' }
    }
  }

  const declineTrip = async (tripId: string, reason: string) => {
    try {
      // Get the trip details first
      const trip = trips.find(t => t.id === tripId)
      if (!trip) throw new Error('Trip not found')

      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'cancelled',
          // Store reason in transportation JSONB field for now
          transportation: { cancellation_reason: reason }
        })
        .eq('id', tripId)

      if (error) throw error

      // Refresh trips
      await fetchTrips()

      // Send decline notification via Edge Function
      try {
        await supabase.functions.invoke('send-notification', {
          body: { 
            type: 'trip_declined', 
            tripId,
            reason,
            teacherEmail: trip.teacher.email,
            teacherName: `${trip.teacher.first_name} ${trip.teacher.last_name}`,
            experienceTitle: trip.experience.title,
            tripDate: trip.trip_date,
            tripTime: trip.trip_time
          }
        })
      } catch (emailError) {
        console.error('Failed to send decline notification:', emailError)
        // Don't fail the decline if email fails
      }

      return { success: true }
    } catch (err) {
      console.error('Error declining trip:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to decline trip' }
    }
  }

  const addNote = async (tripId: string, note: string) => {
    try {
      // Store note in transportation JSONB field
      const trip = trips.find(t => t.id === tripId)
      if (!trip) throw new Error('Trip not found')

      const { error } = await supabase
        .from('trips')
        .update({ 
          transportation: { 
            ...((trip as any).transportation || {}),
            notes: note 
          }
        })
        .eq('id', tripId)

      if (error) throw error

      // Refresh trips
      await fetchTrips()

      return { success: true }
    } catch (err) {
      console.error('Error adding note:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add note' }
    }
  }

  return {
    trips,
    loading,
    error,
    confirmTrip,
    declineTrip,
    addNote,
    refetch: fetchTrips
  }
}
